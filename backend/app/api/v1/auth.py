"""
ATHLETIX — Auth Routes (Phase 1: FULLY IMPLEMENTED)
api/v1/auth.py

Endpoints:
  POST /api/v1/auth/signup  → create Supabase user + insert public.users row
  POST /api/v1/auth/login   → Supabase login → return JWT + role
  POST /api/v1/auth/logout  → Supabase signout (client-side token invalidation)
  GET  /api/v1/auth/me      → return current user's profile from JWT

Design decisions:
  - Role is stored in Supabase user_metadata at signup.
    This embeds it in every JWT automatically — no extra DB call per request.
  - We also insert a row into public.users (Postgres) at signup,
    for relational queries (leaderboard, verifications, etc.).
  - If the Postgres insert fails after Supabase Auth succeeds, we clean up
    the Supabase auth user to keep the two sources in sync.

Rules:
  - All errors follow the { success, error: { code, message } } shape (Rules.md §9)
  - No raw Supabase exceptions bubble to the client
"""

import logging

from fastapi import APIRouter, HTTPException, status, Depends

from app.core.security import get_current_user, AuthenticatedUser
from app.db.supabase_client import get_supabase_client
from app.models.user import (
    SignupRequest,
    LoginRequest,
    AuthTokenData,
    AuthResponse,
    UserProfileResponse,
)

logger = logging.getLogger("athletix.auth")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST /auth/signup
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    """
    Creates a new user account.

    Flow:
      1. Supabase Auth.sign_up with email + password + role in user_metadata
      2. Insert row into public.users (for relational queries)
      3. If step 2 fails → delete the Supabase Auth user (rollback)
      4. Return the session JWT + role info
    """
    supabase = get_supabase_client()

    # ── Step 1: Supabase Auth signup ──────────────────────────────────────────
    try:
        auth_response = supabase.auth.sign_up({
            "email":    body.email,
            "password": body.password,
            "options": {
                "data": {
                    "name": body.name,
                    "role": body.role,
                }
            },
        })
    except Exception as exc:
        logger.error("Supabase Auth signup failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_err("SIGNUP_FAILED", "Could not create account. Please try again."),
        )

    if auth_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_err("EMAIL_ALREADY_REGISTERED", "This email is already registered. Please log in."),
        )

    supabase_user = auth_response.user
    session       = auth_response.session

    # ── Step 2: Insert into public.users ──────────────────────────────────────
    try:
        supabase.table("users").insert({
            "id":    supabase_user.id,
            "name":  body.name,
            "email": body.email,
            "role":  body.role,
        }).execute()
    except Exception as exc:
        # ── Rollback: delete the orphaned Supabase Auth user ──────────────────
        logger.error("public.users insert failed after Auth signup — rolling back: %s", exc)
        try:
            supabase.auth.admin.delete_user(supabase_user.id)
        except Exception as rollback_exc:
            logger.error("Rollback also failed: %s", rollback_exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_err("SIGNUP_DB_ERROR", "Account created but profile setup failed. Please contact support."),
        )

    # ── Step 3: If email confirmation is required, session may be None ────────
    if session is None:
        # Supabase project has email confirmation enabled
        # Return a specific response telling frontend to show confirmation screen
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail={
                "success": True,
                "data": {
                    "requires_confirmation": True,
                    "message": "Check your email to confirm your account before logging in.",
                },
            },
        )

    logger.info("New user signed up: %s | role: %s", body.email, body.role)

    return AuthResponse(
        success=True,
        data=AuthTokenData(
            access_token=session.access_token,
            role=body.role,
            user_id=supabase_user.id,
            name=body.name,
            email=body.email,
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /auth/login
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """
    Authenticates an existing user.
    Returns JWT access_token + role for the frontend to store and use.
    """
    supabase = get_supabase_client()

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email":    body.email,
            "password": body.password,
        })
    except Exception as exc:
        err_str = str(exc).lower()
        logger.warning("Login failed for %s: %s", body.email, exc)
        if "invalid" in err_str or "wrong" in err_str or "credentials" in err_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=_err("INVALID_CREDENTIALS", "Incorrect email or password. Please try again."),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_err("LOGIN_FAILED", "Login failed. Please try again."),
        )

    if auth_response.user is None or auth_response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_err("INVALID_CREDENTIALS", "Incorrect email or password. Please try again."),
        )

    user    = auth_response.user
    session = auth_response.session
    meta    = user.user_metadata or {}
    role    = meta.get("role", "athlete")
    name    = meta.get("name", user.email or "")

    logger.info("User logged in: %s | role: %s", body.email, role)

    return AuthResponse(
        success=True,
        data=AuthTokenData(
            access_token=session.access_token,
            role=role,
            user_id=user.id,
            name=name,
            email=user.email or "",
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /auth/logout
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Invalidates the current session on the Supabase side.
    Frontend should also clear local token storage on receiving this response.
    """
    supabase = get_supabase_client()
    try:
        supabase.auth.sign_out()
    except Exception as exc:
        logger.warning("Logout error (non-critical): %s", exc)

    logger.info("User logged out: %s", user.id)
    return {"success": True, "data": {"message": "Logged out successfully."}}


# ─────────────────────────────────────────────────────────────────────────────
# GET /auth/me  — current user profile from token
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    """Returns the authenticated user's core profile (from JWT — no extra DB call)."""
    return {
        "success": True,
        "data": {
            "user_id": user.id,
            "email":   user.email,
            "role":    user.role,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _err(code: str, message: str) -> dict:
    """Returns the standard ATHLETIX error body shape."""
    return {"success": False, "error": {"code": code, "message": message}}
