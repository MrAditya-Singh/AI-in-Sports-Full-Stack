"""
ATHLETIX — Official Verifications Routes (Phase 6: FULLY IMPLEMENTED)
api/v1/verifications.py

Endpoints:
  POST   /api/v1/verifications          → Official verifies an athlete performance
  GET    /api/v1/verifications/mine     → List verifications made by official (or received by athlete)
  DELETE /api/v1/verifications/{video_id} → Revoke a verification
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends

from app.core.security import require_official, get_current_user, AuthenticatedUser
from app.db.supabase_client import get_supabase_client
from app.models.scouting import VerifyRequest

logger = logging.getLogger("athletix.verifications")
router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def verify_athlete_video(
    body: VerifyRequest,
    official: AuthenticatedUser = Depends(require_official),
):
    """
    Official verifies an athlete's video. Adds a trust badge to the athlete's leaderboard entry.
    Requires Official role.
    """
    supabase = get_supabase_client()

    try:
        # Insert or update verification row
        result = (
            supabase.table("verifications")
            .upsert({
                "official_id": official.id,
                "athlete_id":  body.athlete_id,
                "video_id":    body.video_id,
                "exercise":    body.exercise,
            })
            .execute()
        )

        # Notify athlete
        try:
            supabase.table("notifications").insert({
                "user_id": body.athlete_id,
                "message": f"Official {official.email} verified your {body.exercise} performance! 🏅",
                "type": "verified",
            }).execute()
        except Exception:
            pass

        logger.info("Official %s verified athlete %s for video %s", official.id, body.athlete_id, body.video_id)
        return {"success": True, "data": {"message": "Performance verified successfully.", "verification": result.data}}
    except Exception as exc:
        logger.error("Verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "VERIFY_FAILED", "message": "Could not process verification."}},
        )


@router.get("/mine")
async def get_my_verifications(user: AuthenticatedUser = Depends(get_current_user)):
    """Fetches verifications issued by official or received by athlete."""
    supabase = get_supabase_client()

    try:
        column = "official_id" if user.role == "official" else "athlete_id"
        result = supabase.table("verifications").select("*").eq(column, user.id).execute()
        return {"success": True, "data": result.data or []}
    except Exception as exc:
        logger.error("Fetch verifications error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not fetch verifications."}},
        )


@router.delete("/{video_id}")
async def revoke_verification(
    video_id: str,
    official: AuthenticatedUser = Depends(require_official),
):
    """Revokes a verification badge issued by the official."""
    supabase = get_supabase_client()

    try:
        supabase.table("verifications").delete().eq("official_id", official.id).eq("video_id", video_id).execute()
        return {"success": True, "data": {"message": "Verification revoked."}}
    except Exception as exc:
        logger.error("Revoke verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "REVOKE_FAILED", "message": "Could not revoke verification."}},
        )
