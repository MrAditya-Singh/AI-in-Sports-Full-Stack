"""
ATHLETIX — Notifications Routes (Phase 7: FULLY IMPLEMENTED)
api/v1/notifications.py

Endpoints:
  GET /api/v1/notifications           → Fetch user's notifications & unread count
  PUT /api/v1/notifications/{id}/read → Mark a notification as read
  PUT /api/v1/notifications/read-all  → Mark all user notifications as read
  POST /api/v1/notifications/test     → Trigger a test notification (for demo/testing)
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.core.security import get_current_user, AuthenticatedUser
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.notifications")
router = APIRouter()


@router.get("/")
async def get_my_notifications(user: AuthenticatedUser = Depends(get_current_user)):
    """Fetches all notifications for the authenticated user."""
    supabase = get_supabase_client()

    try:
        res = (
            supabase.table("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", desc=True)
            .execute()
        )
        notifications = res.data or []
        unread_count = sum(1 for n in notifications if not n.get("is_read"))

        return {
            "success": True,
            "data": {
                "unread_count": unread_count,
                "notifications": notifications,
            },
        }
    except Exception as exc:
        logger.error("Error fetching notifications for %s: %s", user.id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not fetch notifications."}},
        )


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Marks a single notification as read."""
    supabase = get_supabase_client()

    try:
        supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", user.id).execute()
        return {"success": True, "data": {"message": "Notification marked as read."}}
    except Exception as exc:
        logger.error("Error updating notification %s: %s", notification_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "UPDATE_FAILED", "message": "Could not update notification."}},
        )


@router.put("/read-all")
async def mark_all_read(user: AuthenticatedUser = Depends(get_current_user)):
    """Marks all notifications as read for the user."""
    supabase = get_supabase_client()

    try:
        supabase.table("notifications").update({"is_read": True}).eq("user_id", user.id).execute()
        return {"success": True, "data": {"message": "All notifications marked as read."}}
    except Exception as exc:
        logger.error("Error marking all read for %s: %s", user.id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "UPDATE_FAILED", "message": "Could not mark notifications read."}},
        )


@router.post("/test", status_code=status.HTTP_201_CREATED)
async def create_test_notification(
    user: AuthenticatedUser = Depends(get_current_user),
    message: str = Body("Your AI performance report is ready! 🎯", embed=True),
    type_str: str = Body("report_ready", embed=True),
):
    """Triggers a test notification for demo/testing."""
    supabase = get_supabase_client()

    try:
        res = supabase.table("notifications").insert({
            "user_id": user.id,
            "message": message,
            "type": type_str,
            "is_read": False,
        }).execute()

        return {"success": True, "data": {"message": "Notification generated.", "notification": res.data}}
    except Exception as exc:
        logger.error("Error creating test notification: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "CREATE_FAILED", "message": "Could not create notification."}},
        )
