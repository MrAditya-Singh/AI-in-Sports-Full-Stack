"""
ATHLETIX — Official Shortlists Routes (Phase 6: FULLY IMPLEMENTED)
api/v1/shortlists.py

Endpoints:
  POST   /api/v1/shortlists             → Shortlist an athlete
  DELETE /api/v1/shortlists/{athlete_id} → Remove athlete from shortlist
  GET    /api/v1/shortlists/mine        → Fetch official's shortlisted athletes
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends

from app.core.security import require_official, AuthenticatedUser
from app.db.supabase_client import get_supabase_client
from app.models.scouting import ShortlistRequest

logger = logging.getLogger("athletix.shortlists")
router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_to_shortlist(
    body: ShortlistRequest,
    official: AuthenticatedUser = Depends(require_official),
):
    """Adds an athlete to the official's talent shortlist."""
    supabase = get_supabase_client()

    try:
        result = (
            supabase.table("shortlists")
            .upsert({
                "official_id": official.id,
                "athlete_id":  body.athlete_id,
                "sport":       body.sport,
            })
            .execute()
        )

        # Notify athlete
        try:
            supabase.table("notifications").insert({
                "user_id": body.athlete_id,
                "message": "An Official has shortlisted you for talent selection! ⭐",
                "type": "shortlisted",
            }).execute()
        except Exception:
            pass

        logger.info("Official %s shortlisted athlete %s for sport %s", official.id, body.athlete_id, body.sport)
        return {"success": True, "data": {"message": "Athlete added to shortlist.", "shortlist": result.data}}
    except Exception as exc:
        logger.error("Shortlist failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "SHORTLIST_FAILED", "message": "Could not add athlete to shortlist."}},
        )


@router.delete("/{athlete_id}")
async def remove_from_shortlist(
    athlete_id: str,
    official: AuthenticatedUser = Depends(require_official),
):
    """Removes an athlete from the official's shortlist."""
    supabase = get_supabase_client()

    try:
        supabase.table("shortlists").delete().eq("official_id", official.id).eq("athlete_id", athlete_id).execute()
        return {"success": True, "data": {"message": "Athlete removed from shortlist."}}
    except Exception as exc:
        logger.error("Remove shortlist failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "REMOVE_FAILED", "message": "Could not remove athlete from shortlist."}},
        )


@router.get("/mine")
async def get_my_shortlist(official: AuthenticatedUser = Depends(require_official)):
    """Fetches all athletes shortlisted by the official, populated with athlete profiles."""
    supabase = get_supabase_client()

    try:
        res = supabase.table("shortlists").select("*").eq("official_id", official.id).execute()
        shortlists = res.data or []

        enriched = []
        for item in shortlists:
            ath_id = item["athlete_id"]
            user_res = (
                supabase.table("users")
                .select("id, name, email, created_at")
                .eq("id", ath_id)
                .maybe_single()
                .execute()
            )
            ap_res = (
                supabase.table("athlete_profiles")
                .select("age, gender, location, bio, primary_sport, height_cm, weight_kg, experience_level")
                .eq("user_id", ath_id)
                .maybe_single()
                .execute()
            )

            athlete_info = user_res.data or {}
            athlete_info["athlete_profile"] = ap_res.data or {}
            item["athlete"] = athlete_info
            enriched.append(item)

        return {"success": True, "data": enriched}
    except Exception as exc:
        logger.error("Fetch shortlist error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not fetch shortlist."}},
        )
