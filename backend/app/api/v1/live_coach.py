"""
ATHLETIX — Live AI Posture Coach Router
api/v1/live_coach.py

Integrates the real-time AI Gym Coach feature from `ai-gym-coach-main - Copy`:
  - Auto-authenticates athlete via launch URL
  - Persists completed real-time workout metrics
"""

import logging
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Depends

from app.core.config import settings
from app.core.security import require_athlete, AuthenticatedUser
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.live_coach")
router = APIRouter()


class LiveSessionPayload(BaseModel):
    exercise_name: str
    sets_completed: int
    total_reps: int
    duration_seconds: int
    accuracy_score: Optional[float] = 95.0


@router.get("/launch-url")
async def get_live_launch_url(athlete: AuthenticatedUser = Depends(require_athlete)):
    """
    Returns the launch URL for the `ai-gym-coach-main - Copy` live posture tracker
    pre-configured with the athlete's authenticated username for single-sign-on (SSO).
    """
    username = athlete.email.split("@")[0] if athlete.email else f"athlete_{athlete.id[:6]}"
    base_url = settings.LIVE_COACH_URL.rstrip("/") if settings.LIVE_COACH_URL else ""
    launch_url = f"{base_url}/?username={username}" if base_url else ""

    return {
        "success": True,
        "data": {
            "launch_url": launch_url,
            "username": username,
            "service_status": "active" if base_url else "unconfigured",
        },
    }


@router.post("/session", status_code=status.HTTP_201_CREATED)
async def log_live_session(
    payload: LiveSessionPayload,
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    """
    Persists a completed real-time live posture session into athlete activity notifications.
    """
    supabase = get_supabase_client()
    try:
        message = (
            f"⚡ Live AI Posture: Completed {payload.total_reps} reps of "
            f"{payload.exercise_name} ({payload.sets_completed} sets) with "
            f"{payload.accuracy_score:.0f}% form accuracy!"
        )
        supabase.table("notifications").insert({
            "user_id": athlete.id,
            "message": message,
            "type": "live_workout",
        }).execute()

        logger.info("Saved live session for athlete %s: %s", athlete.id, message)
        return {
            "success": True,
            "data": {
                "message": "Live session logged successfully! 🎯",
                "summary": payload.model_dump(),
            },
        }
    except Exception as exc:
        logger.error("Failed to log live session: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"message": "Failed to log session"}},
        )
