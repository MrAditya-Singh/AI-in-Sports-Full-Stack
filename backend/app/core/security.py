"""
ATHLETIX — Auth Middleware & Role Enforcement
core/security.py

Responsibilities:
  - Verify Supabase JWT on every protected request
  - Extract user_id and role from the verified token
  - Provide FastAPI dependency functions for role-based access control

Usage in route handlers:
    from app.core.security import require_athlete, require_official, require_admin

    @router.get("/my-reports")
    async def get_reports(user = Depends(require_athlete)):
        # user.id, user.role are available here

Rules (Rules.md §8):
  - Auth checks are NEVER skipped, even "to test faster"
  - Role enforcement is always on the route that needs it
"""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.security")
bearer_scheme = HTTPBearer()


class AuthenticatedUser:
    """Minimal user context extracted from a verified Supabase JWT."""

    def __init__(self, user_id: str, role: str, email: str):
        self.id = user_id
        self.role = role
        self.email = email


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> AuthenticatedUser:
    """
    Verifies the Bearer token against Supabase Auth.
    Returns an AuthenticatedUser on success; raises 401 on failure.
    """
    token = credentials.credentials
    supabase = get_supabase_client()

    try:
        response = supabase.auth.get_user(token)
        if response.user is None:
            raise ValueError("No user returned from Supabase")
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Authentication token is invalid or expired.",
                },
            },
        )

    supabase_user = response.user
    user_meta = supabase_user.user_metadata or {}
    role = user_meta.get("role", "athlete")  # default to least-privilege role

    return AuthenticatedUser(
        user_id=supabase_user.id,
        role=role,
        email=supabase_user.email or "",
    )


def _require_role(required_role: str):
    """Factory: returns a FastAPI dependency that enforces a specific role."""

    async def role_guard(
        user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    ) -> AuthenticatedUser:
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": f"This action requires the '{required_role}' role.",
                    },
                },
            )
        return user

    return role_guard


# ─── Role dependency callable shortcuts ─────────────────────────────────────────
require_athlete  = _require_role("athlete")
require_official = _require_role("official")
require_admin    = _require_role("admin")

# Any authenticated user (no role restriction)
require_auth = get_current_user
