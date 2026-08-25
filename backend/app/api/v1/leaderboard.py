"""
ATHLETIX — Leaderboard Routes (Phase 6: FULLY IMPLEMENTED)
api/v1/leaderboard.py

Endpoints:
  GET /api/v1/leaderboard → Query ranked athletes by sport & exercise
"""

import logging
from typing import Literal
from fastapi import APIRouter, HTTPException, Query, status

from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.leaderboard")
router = APIRouter()


@router.get("/")
async def get_leaderboard(
    sport: Literal["powerlifting", "calisthenics"] | None = Query(None, description="Filter by sport"),
    exercise: str | None = Query(None, description="Filter by exercise key"),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Fetches ranked athletes from leaderboard_view.
    Returns array sorted by rank (score DESC). Includes official verification badge flag.
    """
    supabase = get_supabase_client()

    try:
        query = supabase.table("leaderboard_view").select("*")

        if sport:
            query = query.eq("sport", sport)
        if exercise:
            query = query.eq("exercise", exercise)

        result = query.order("score", desc=True).limit(limit).execute()
        rows = result.data or []

        # Calculate rank dynamically if view query returns unordered rows
        for index, row in enumerate(rows):
            row["rank"] = index + 1

        return {"success": True, "data": rows}
    except Exception as exc:
        logger.error("Error fetching leaderboard: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "LEADERBOARD_ERROR", "message": "Could not fetch leaderboard data."}},
        )
