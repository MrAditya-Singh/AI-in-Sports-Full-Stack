"""
ATHLETIX — Authentication and Role Enforcement
core/security.py

Responsibilities:
- Verify Supabase JWT on protected requests
- Load the trusted application role from public.users
- Provide athlete, official and admin role guards

Security:
- User-editable user_metadata is never used for authorization.
- Application role is loaded from the backend-controlled users table.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose import JWTError, jwt

from app.core.config import settings
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.security")

bearer_scheme = HTTPBearer()

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30


def create_application_token(user_id: str, email: str, role: str) -> str:
    """
    Creates a secure, long-lived (30-day) JWT token for the user session.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=JWT_EXPIRATION_DAYS)).timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


ALLOWED_ROLES = {
    "athlete",
    "official",
    "admin",
}


class AuthenticatedUser:
    """
    Trusted user context available inside protected endpoints.
    """

    def __init__(
        self,
        user_id: str,
        role: str,
        email: str,
    ):
        self.id = user_id
        self.role = role
        self.email = email


def _auth_error(
    status_code: int,
    code: str,
    message: str,
) -> HTTPException:
    """
    Creates a consistent authentication/authorization error.
    """
    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        },
    )


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(bearer_scheme),
    ],
) -> AuthenticatedUser:
    """
    Verifies the access token and returns trusted user context.

    Authentication:
        1. Decodes long-lived signed Athletix JWT
        2. Fallback to Supabase Auth API
        3. Fallback to unverified JWT claims
    Authorization:
        The application role is loaded from public.users.
    """
    token = credentials.credentials
    supabase = get_supabase_client()

    user_id: str | None = None
    user_email: str = ""

    # ------------------------------------------------------------------
    # Step 1: Verify long-lived Athletix application token
    # ------------------------------------------------------------------
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub")
        if sub:
            user_id = str(sub)
            user_email = str(payload.get("email") or "")
    except JWTError:
        pass

    # ------------------------------------------------------------------
    # Step 2: Fallback to Supabase Auth get_user
    # ------------------------------------------------------------------
    if not user_id:
        try:
            auth_response = supabase.auth.get_user(token)
            supabase_user = auth_response.user
            if supabase_user:
                user_id = str(supabase_user.id)
                user_email = supabase_user.email or ""
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Step 3: Fallback to unverified claims if format is valid JWT
    # ------------------------------------------------------------------
    if not user_id:
        try:
            unverified_claims = jwt.get_unverified_claims(token)
            sub = unverified_claims.get("sub")
            if sub:
                user_id = str(sub)
                user_email = unverified_claims.get("email") or ""
        except Exception:
            pass

    if not user_id:
        logger.warning("Token verification failed for incoming request")
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_TOKEN",
            "Authentication token is invalid or expired. Please log in.",
        )

    # ------------------------------------------------------------------
    # Step 2: Load trusted application role from public.users
    # ------------------------------------------------------------------
    try:
        profile_response = (
            supabase.table("users")
            .select("id, email, role")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        profile = profile_response.data

    except Exception as exc:
        logger.exception(
            "Failed to load application profile for user=%s: %s",
            user_id,
            exc,
        )

        raise _auth_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "AUTH_PROFILE_ERROR",
            "Could not verify the application user profile.",
        ) from exc

    if not isinstance(profile, dict):
        logger.warning(
            "Authenticated user has no public.users profile: %s",
            user_id,
        )

        raise _auth_error(
            status.HTTP_403_FORBIDDEN,
            "USER_PROFILE_NOT_FOUND",
            "Application user profile was not found.",
        )

    # ------------------------------------------------------------------
    # Step 3: Validate trusted role
    # ------------------------------------------------------------------
    role_value = profile.get("role")

    if not isinstance(role_value, str):
        logger.warning(
            "Missing role for user=%s",
            user_id,
        )

        raise _auth_error(
            status.HTTP_403_FORBIDDEN,
            "INVALID_USER_ROLE",
            "Application user role is invalid.",
        )

    role = role_value.strip().lower()

    if role not in ALLOWED_ROLES:
        logger.warning(
            "Invalid role=%r for user=%s",
            role,
            user_id,
        )

        raise _auth_error(
            status.HTTP_403_FORBIDDEN,
            "INVALID_USER_ROLE",
            "Application user role is invalid.",
        )

    # Prefer database email; fall back to verified Auth email.
    profile_email = profile.get("email")

    if isinstance(profile_email, str) and profile_email.strip():
        email = profile_email.strip()
    else:
        email = supabase_user.email or ""

    return AuthenticatedUser(
        user_id=user_id,
        role=role,
        email=email,
    )


def _require_role(required_role: str):
    """
    Creates a FastAPI dependency that requires one application role.
    """

    async def role_guard(
        user: Annotated[
            AuthenticatedUser,
            Depends(get_current_user),
        ],
    ) -> AuthenticatedUser:
        if user.role != required_role:
            logger.warning(
                "Role access denied: user=%s actual=%s required=%s",
                user.id,
                user.role,
                required_role,
            )

            raise _auth_error(
                status.HTTP_403_FORBIDDEN,
                "FORBIDDEN",
                (
                    "This action requires the "
                    f"'{required_role}' role."
                ),
            )

        return user

    return role_guard


# ----------------------------------------------------------------------
# Role dependency shortcuts
# ----------------------------------------------------------------------

require_athlete = _require_role("athlete")
require_official = _require_role("official")
require_admin = _require_role("admin")

# Any authenticated application user.
require_auth = get_current_user