"""
ATHLETIX — Assessments & AI Reports API (Phase 4/5: FULLY IMPLEMENTED)
api/v1/assessments.py

Endpoints:
  GET /api/v1/assessments          → List authenticated athlete's assessments
  GET /api/v1/assessments/latest   → Get athlete's latest completed assessment
  GET /api/v1/assessments/{id}     → Get single assessment report detail
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends

from app.core.security import require_athlete, AuthenticatedUser
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.assessments")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# GET /assessments — List athlete's assessments
# ─────────────────────────────────────────────────────────────────────────────
@router.get("")
async def get_my_assessments(athlete: AuthenticatedUser = Depends(require_athlete)):
    """Fetches all AI assessment reports for the authenticated athlete."""
    supabase = get_supabase_client()
    try:
        # Join with videos table to get exercise and sport info
        res = (
            supabase.table("assessments")
            .select("*, videos!inner(*)")
            .eq("videos.athlete_id", athlete.id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"success": True, "data": res.data or []}
    except Exception as exc:
        logger.error("Get assessments failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not retrieve assessment reports."}},
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /assessments/latest — Get latest assessment for dashboard summary
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/latest")
async def get_latest_assessment(athlete: AuthenticatedUser = Depends(require_athlete)):
    """Fetches the most recent assessment report for the athlete."""
    supabase = get_supabase_client()
    try:
        res = (
            supabase.table("assessments")
            .select("*, videos!inner(*)")
            .eq("videos.athlete_id", athlete.id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        data = res.data[0] if res.data else None
        return {"success": True, "data": data}
    except Exception as exc:
        logger.error("Get latest assessment failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not retrieve latest report."}},
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /assessments/{assessment_id} — Single assessment detail
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{assessment_id}")
async def get_assessment_detail(
    assessment_id: str,
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    """Fetches a detailed AI assessment report by assessment ID."""
    supabase = get_supabase_client()
    try:
        res = (
            supabase.table("assessments")
            .select("*, videos(*)")
            .eq("id", assessment_id)
            .maybe_single()
            .execute()
        )
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Assessment not found."}},
            )
        return {"success": True, "data": res.data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Get assessment detail failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not retrieve assessment."}},
        )
