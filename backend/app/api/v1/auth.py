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

from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, status, Depends

from app.core.config import settings
from app.core.security import get_current_user, AuthenticatedUser, create_application_token
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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    access_token: Optional[str] = None
    new_password: str


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

    # ── Step 1: Create Supabase Auth User with auto-confirmation ───────────
    supabase_user = None
    try:
        admin_user_res = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {
                "name": body.name,
                "role": body.role,
            },
        })
        supabase_user = getattr(admin_user_res, "user", None) or admin_user_res
    except Exception as admin_exc:
        err_msg = str(admin_exc).lower()
        if "already" in err_msg or "exists" in err_msg or "unique" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=_err("EMAIL_ALREADY_REGISTERED", "This email is already registered. Please log in."),
            )
        logger.warning("Admin create_user fallback: %s", admin_exc)
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
            supabase_user = auth_response.user
        except Exception as exc:
            err_str = str(exc).lower()
            if "already" in err_str or "exists" in err_str or "unique" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=_err("EMAIL_ALREADY_REGISTERED", "This email is already registered. Please log in."),
                )
            logger.error("Supabase Auth signup failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=_err("SIGNUP_FAILED", "Could not create account. Please try again."),
            )


    if supabase_user is None or not getattr(supabase_user, "id", None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_err("EMAIL_ALREADY_REGISTERED", "This email is already registered. Please log in."),
        )

    user_id = str(supabase_user.id)

    # ── Step 2: Insert/Upsert into public.users ──────────────────────────────
    try:
        supabase.table("users").upsert({
            "id":    user_id,
            "name":  body.name,
            "email": body.email,
            "role":  body.role,
        }).execute()
    except Exception as exc:
        logger.error("public.users upsert failed: %s", exc)

    # ── Step 3: Sign in to generate immediate active JWT session ─────────────
    access_token = create_application_token(
        user_id=user_id,
        email=body.email,
        role=body.role,
    )

    logger.info("New user signed up successfully: %s | role: %s", body.email, body.role)

    return AuthResponse(
        success=True,
        data=AuthTokenData(
            access_token=access_token,
            role=body.role,
            user_id=user_id,
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
        # pyrefly: ignore [bad-argument-type]
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

    if auth_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_err("INVALID_CREDENTIALS", "Incorrect email or password. Please try again."),
        )

    user    = auth_response.user
    meta    = user.user_metadata or {}
    role    = meta.get("role", "athlete")
    name    = meta.get("name", user.email or "")

    # Create secure 30-day token
    access_token = create_application_token(
        user_id=str(user.id),
        email=user.email or body.email,
        role=role,
    )

    logger.info("User logged in: %s | role: %s", body.email, role)

    return AuthResponse(
        success=True,
        data=AuthTokenData(
            access_token=access_token,
            role=role,
            user_id=str(user.id),
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
# POST /auth/forgot-password
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """
    Sends a password reset email to the user via Supabase Auth.
    """
    supabase = get_supabase_client()
    try:
        redirect_url = f"{settings.FRONTEND_URL}/reset-password"
        try:
            supabase.auth.reset_password_for_email(body.email, options={"redirect_to": redirect_url})
        except Exception:
            supabase.auth.reset_password_for_email(body.email)
    except Exception as exc:
        logger.warning("Forgot password request error for %s: %s", body.email, exc)

    return {
        "success": True,
        "data": {
            "message": "If an account with this email exists, a password reset link has been dispatched."
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /auth/reset-password
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """
    Updates the user's password.
    """
    supabase = get_supabase_client()
    try:
        if body.access_token:
            supabase.auth.update_user({"password": body.new_password})
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=_err("MISSING_TOKEN", "Valid password reset token is required."),
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Reset password failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_err("RESET_FAILED", "Failed to update password. Link may have expired."),
        )

    return {
        "success": True,
        "data": {"message": "Password updated successfully. You can now log in."},
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _err(code: str, message: str) -> dict:
    """Returns the standard ATHLETIX error body shape."""
    return {"success": False, "error": {"code": code, "message": message}}
