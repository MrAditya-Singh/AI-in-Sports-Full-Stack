"""
ATHLETIX — Push Token API
app/api/v1/push_tokens.py

Endpoints:
  POST   /api/v1/push-tokens      — Register an Expo push token
  DELETE /api/v1/push-tokens      — Remove a push token (e.g. on logout)
"""

import logging

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    status,
)

from app.core.security import (
    AuthenticatedUser,
    get_current_user,
)
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.push_tokens")
router = APIRouter()


def _api_error(
    status_code: int,
    code: str,
    message: str,
) -> HTTPException:
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


# ---------------------------------------------------------------------------
# POST /push-tokens
# ---------------------------------------------------------------------------

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def register_push_token(
    token: str = Body(
        ...,
        embed=True,
        min_length=1,
        max_length=500,
    ),
    platform: str = Body(
        default="expo",
        embed=True,
    ),
    user: AuthenticatedUser = Depends(
        get_current_user
    ),
):
    """
    Registers an Expo push token for the authenticated user.
    Upserts on (user_id, token) to avoid duplicates.
    """
    cleaned_token = token.strip()

    if not cleaned_token:
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_TOKEN",
            "Push token cannot be blank.",
        )

    supabase = get_supabase_client()

    try:
        response = (
            supabase.table("push_tokens")
            .upsert(
                {
                    "user_id": user.id,
                    "token": cleaned_token,
                    "platform": platform.strip() or "expo",
                },
                on_conflict="user_id,token",
            )
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Push token upsert returned no data."
            )

        return {
            "success": True,
            "data": {
                "message": "Push token registered.",
                "token": response.data[0],
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Push token registration failed for user %s: %s",
            user.id,
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "TOKEN_REGISTER_FAILED",
            "Could not register push token.",
        ) from exc


# ---------------------------------------------------------------------------
# DELETE /push-tokens
# ---------------------------------------------------------------------------

@router.delete("")
async def unregister_push_token(
    token: str = Body(
        ...,
        embed=True,
        min_length=1,
        max_length=500,
    ),
    user: AuthenticatedUser = Depends(
        get_current_user
    ),
):
    """
    Removes a push token for the authenticated user (e.g. on logout).
    """
    cleaned_token = token.strip()

    if not cleaned_token:
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_TOKEN",
            "Push token cannot be blank.",
        )

    supabase = get_supabase_client()

    try:
        response = (
            supabase.table("push_tokens")
            .delete()
            .eq("user_id", user.id)
            .eq("token", cleaned_token)
            .execute()
        )

        deleted = response.data or []

        return {
            "success": True,
            "data": {
                "message": (
                    "Push token removed."
                    if deleted
                    else "Push token was not found."
                ),
                "removed": len(deleted),
            },
        }

    except Exception as exc:
        logger.exception(
            "Push token removal failed for user %s: %s",
            user.id,
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "TOKEN_REMOVE_FAILED",
            "Could not remove push token.",
        ) from exc
