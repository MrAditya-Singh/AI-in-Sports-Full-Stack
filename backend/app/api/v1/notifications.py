"""
ATHLETIX — Notification API
app/api/v1/notifications.py

Endpoints:
  GET /api/v1/notifications
  PUT /api/v1/notifications/read-all
  PUT /api/v1/notifications/{notification_id}/read
  POST /api/v1/notifications/test
"""

import logging
import uuid
from typing import Literal

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.config import settings
from app.core.security import (
    AuthenticatedUser,
    get_current_user,
)
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.notifications")
router = APIRouter()


NotificationType = Literal[
    "report_ready",
    "verified",
    "shortlisted",
    "verification_pending",
    "verification_approved",
    "verification_rejected",
    "general",
]


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


def _validate_uuid(
    value: str,
    field_name: str,
) -> str:
    try:
        return str(uuid.UUID(str(value)))
    except (
        ValueError,
        TypeError,
        AttributeError,
    ) as exc:
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_ID",
            f"{field_name} is invalid.",
        ) from exc


# ---------------------------------------------------------------------------
# GET /notifications
# ---------------------------------------------------------------------------

@router.get("")
async def get_my_notifications(
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    user: AuthenticatedUser = Depends(
        get_current_user
    ),
):
    """
    Returns authenticated user's notification list and total unread count.
    """
    supabase = get_supabase_client()

    try:
        notification_response = (
            supabase.table("notifications")
            .select(
                "id,user_id,message,type,"
                "is_read,created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        unread_response = (
            supabase.table("notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_read", False)
            .execute()
        )

        notifications = (
            notification_response.data or []
        )

        unread_notifications = (
            unread_response.data or []
        )

        return {
            "success": True,
            "data": {
                "unread_count": len(
                    unread_notifications
                ),
                "notifications": notifications,
            },
            "meta": {
                "limit": limit,
                "returned": len(notifications),
            },
        }

    except Exception as exc:
        logger.exception(
            "Notification fetch failed for user %s: %s",
            user.id,
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "NOTIFICATION_FETCH_FAILED",
            "Could not fetch notifications.",
        ) from exc


# ---------------------------------------------------------------------------
# PUT /notifications/read-all
#
# IMPORTANT:
# Static route parameterized route se pehle rakha gaya hai.
# ---------------------------------------------------------------------------

@router.put("/read-all")
async def mark_all_notifications_read(
    user: AuthenticatedUser = Depends(
        get_current_user
    ),
):
    """
    Marks every unread notification owned by the current user as read.
    """
    supabase = get_supabase_client()

    try:
        response = (
            supabase.table("notifications")
            .update({
                "is_read": True,
            })
            .eq("user_id", user.id)
            .eq("is_read", False)
            .execute()
        )

        updated = response.data or []

        return {
            "success": True,
            "data": {
                "message": (
                    "All notifications marked as read."
                ),
                "updated_count": len(updated),
            },
        }

    except Exception as exc:
        logger.exception(
            "Mark-all-read failed for user %s: %s",
            user.id,
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "NOTIFICATION_UPDATE_FAILED",
            "Could not mark notifications as read.",
        ) from exc


# ---------------------------------------------------------------------------
# PUT /notifications/{notification_id}/read
# ---------------------------------------------------------------------------

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: AuthenticatedUser = Depends(
        get_current_user
    ),
):
    """
    Marks one notification as read.

    Both notification ID and current user ID are included in the update query,
    preventing another user's notification from being modified.
    """
    validated_id = _validate_uuid(
        notification_id,
        "Notification ID",
    )

    supabase = get_supabase_client()

    try:
        existing_response = (
            supabase.table("notifications")
            .select("id,is_read")
            .eq("id", validated_id)
            .eq("user_id", user.id)
            .maybe_single()
            .execute()
        )

        existing = existing_response.data

        if not isinstance(existing, dict):
            raise _api_error(
                status.HTTP_404_NOT_FOUND,
                "NOTIFICATION_NOT_FOUND",
                "Notification was not found.",
            )

        if existing.get("is_read") is True:
            return {
                "success": True,
                "data": {
                    "message": (
                        "Notification is already read."
                    ),
                    "notification_id": validated_id,
                    "already_read": True,
                },
            }

        update_response = (
            supabase.table("notifications")
            .update({
                "is_read": True,
            })
            .eq("id", validated_id)
            .eq("user_id", user.id)
            .execute()
        )

        if not update_response.data:
            raise _api_error(
                status.HTTP_404_NOT_FOUND,
                "NOTIFICATION_NOT_FOUND",
                "Notification was not found.",
            )

        return {
            "success": True,
            "data": {
                "message": (
                    "Notification marked as read."
                ),
                "notification_id": validated_id,
                "already_read": False,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Notification update failed for %s: %s",
            validated_id,
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "NOTIFICATION_UPDATE_FAILED",
            "Could not update notification.",
        ) from exc


# ---------------------------------------------------------------------------
# POST /notifications/test
# ---------------------------------------------------------------------------

@router.post(
    "/test",
    status_code=status.HTTP_201_CREATED,
)
async def create_test_notification(
    message: str = Body(
        default=(
            "Your AI performance report is ready!"
        ),
        embed=True,
        min_length=1,
        max_length=500,
    ),
    type_str: NotificationType = Body(
        default="general",
        embed=True,
    ),
    user: AuthenticatedUser = Depends(
        get_current_user
    ),
):
    """
    Creates a demo notification in development only.
    """
    if settings.APP_ENV.lower() == "production":
        raise _api_error(
            status.HTTP_404_NOT_FOUND,
            "NOT_FOUND",
            "Test notifications are not available.",
        )

    cleaned_message = message.strip()

    if not cleaned_message:
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_MESSAGE",
            "Notification message cannot be blank.",
        )

    supabase = get_supabase_client()

    try:
        response = (
            supabase.table("notifications")
            .insert({
                "user_id": user.id,
                "message": cleaned_message,
                "type": type_str,
                "is_read": False,
            })
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Notification insert returned no data."
            )

        return {
            "success": True,
            "data": {
                "message": (
                    "Test notification generated."
                ),
                "notification": response.data[0],
            },
        }

    except Exception as exc:
        logger.exception(
            "Test notification creation failed: %s",
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "NOTIFICATION_CREATE_FAILED",
            "Could not create test notification.",
        ) from exc