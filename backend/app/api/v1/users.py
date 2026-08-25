"""
ATHLETIX — User Profile Routes (Phase 1)
api/v1/users.py

Endpoints:
  GET  /api/v1/users/me         → Fetch own profile from public.users
  PUT  /api/v1/users/me         → Update own name in public.users
  GET  /api/v1/users/me/athlete → Fetch extended athlete profile
  PUT  /api/v1/users/me/athlete → Update extended athlete profile

All endpoints require authentication (any role).
Athletes get the extended profile fields; officials and admins only see core fields.
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends

from app.core.security import get_current_user, AuthenticatedUser
from app.db.supabase_client import get_supabase_client
from app.models.user import UpdateProfileRequest, AthleteProfileUpdate

logger = logging.getLogger("athletix.users")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# GET /users/me — full profile
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me")
async def get_my_profile(user: AuthenticatedUser = Depends(get_current_user)):
    """Returns own user profile from public.users."""
    supabase = get_supabase_client()

    try:
        result = (
            supabase.table("users")
            .select("id, name, email, role, created_at")
            .eq("id", user.id)
            .single()
            .execute()
        )
    except Exception as exc:
        logger.error("get_my_profile DB error for %s: %s", user.id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "DB_ERROR", "message": "Could not fetch profile."}},
        )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "USER_NOT_FOUND", "message": "User profile not found."}},
        )

    profile = result.data

    # Attach athlete-specific fields if applicable
    if user.role == "athlete":
        try:
            ap = (
                supabase.table("athlete_profiles")
                .select("age, gender, location, bio, primary_sport, height_cm, weight_kg, experience_level")
                .eq("user_id", user.id)
                .maybe_single()
                .execute()
            )
            ath_data = ap.data or {}
            profile["athlete_profile"] = ath_data
            profile["completeness_percent"] = _calculate_completeness(profile["name"], ath_data)
        except Exception:
            profile["athlete_profile"] = {}
            profile["completeness_percent"] = 20  # Name registered only

    return {"success": True, "data": profile}


# ─────────────────────────────────────────────────────────────────────────────
# GET /users/athlete/{athlete_id} — fetch athlete profile (Official/Admin/Self)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/athlete/{athlete_id}")
async def get_athlete_profile_by_id(
    athlete_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Fetches public athlete profile for officials, admins, or self."""
    supabase = get_supabase_client()

    try:
        user_res = (
            supabase.table("users")
            .select("id, name, email, role, created_at")
            .eq("id", athlete_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Athlete not found."}},
        )

    if not user_res.data or user_res.data["role"] != "athlete":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_AN_ATHLETE", "message": "Specified user is not an athlete."}},
        )

    ap_res = (
        supabase.table("athlete_profiles")
        .select("age, gender, location, bio, primary_sport, height_cm, weight_kg, experience_level")
        .eq("user_id", athlete_id)
        .maybe_single()
        .execute()
    )

    ath_data = ap_res.data or {}
    data = user_res.data
    data["athlete_profile"] = ath_data
    data["completeness_percent"] = _calculate_completeness(data["name"], ath_data)

    return {"success": True, "data": data}


# ─────────────────────────────────────────────────────────────────────────────
# PUT /users/me — update core profile
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/me")
async def update_my_profile(
    body: UpdateProfileRequest,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Updates own name in public.users."""
    supabase = get_supabase_client()

    updates = {}
    if body.name is not None:
        updates["name"] = body.name

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "NO_FIELDS", "message": "No fields provided to update."}},
        )

    try:
        result = (
            supabase.table("users")
            .update(updates)
            .eq("id", user.id)
            .execute()
        )
    except Exception as exc:
        logger.error("update_my_profile DB error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "UPDATE_FAILED", "message": "Could not update profile."}},
        )

    return {"success": True, "data": {"message": "Profile updated successfully."}}


# ─────────────────────────────────────────────────────────────────────────────
# PUT /users/me/athlete — upsert extended athlete profile
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/me/athlete")
async def update_athlete_profile(
    body: AthleteProfileUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Updates or creates the extended athlete profile row."""
    if user.role != "athlete":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Only athletes can update athlete profiles."}},
        )

    supabase = get_supabase_client()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["user_id"] = user.id

    try:
        supabase.table("athlete_profiles").upsert(updates).execute()
    except Exception as exc:
        logger.error("update_athlete_profile DB error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "UPDATE_FAILED", "message": "Could not update athlete profile."}},
        )

    return {"success": True, "data": {"message": "Athlete profile updated successfully."}}


def _calculate_completeness(name: str, ap: dict) -> int:
    """Calculates profile completeness percentage (0-100%)."""
    fields = [
        bool(name),
        bool(ap.get("age")),
        bool(ap.get("gender")),
        bool(ap.get("location")),
        bool(ap.get("primary_sport")),
        bool(ap.get("height_cm")),
        bool(ap.get("weight_kg")),
        bool(ap.get("experience_level")),
        bool(ap.get("bio")),
    ]
    completed = sum(1 for f in fields if f)
    return int((completed / len(fields)) * 100)
