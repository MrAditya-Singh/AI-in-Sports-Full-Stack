"""
ATHLETIX — Official Shortlist Routes
app/api/v1/shortlists.py

Endpoints:
  POST   /api/v1/shortlists
  GET    /api/v1/shortlists/mine
  DELETE /api/v1/shortlists/{athlete_id}?sport=powerlifting
"""

import logging
from typing import Literal
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)

from app.core.security import (
    AuthenticatedUser,
    require_official,
)
from app.db.supabase_client import get_supabase_client
from app.models.scouting import ShortlistRequest

logger = logging.getLogger("athletix.shortlists")
router = APIRouter()

ShortlistSport = Literal[
    "powerlifting",
    "calisthenics",
]


def validate_uuid(
    value: str,
    field_name: str,
) -> str:
    """Validates and normalizes a UUID."""

    try:
        return str(UUID(str(value).strip()))
    except (
        ValueError,
        TypeError,
        AttributeError,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_ID",
                    "message": (
                        f"{field_name} must be a valid UUID."
                    ),
                },
            },
        )


def validate_sport(value: str) -> ShortlistSport:
    """Validates and normalizes shortlist sport."""

    cleaned = value.strip().lower()

    if cleaned not in {
        "powerlifting",
        "calisthenics",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_SPORT",
                    "message": (
                        "Sport must be powerlifting "
                        "or calisthenics."
                    ),
                },
            },
        )

    return cleaned  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# POST /shortlists
# ---------------------------------------------------------------------------

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def add_to_shortlist(
    body: ShortlistRequest,
    response: Response,
    official: AuthenticatedUser = Depends(
        require_official
    ),
):
    """
    Adds an athlete to the authenticated official's
    sport-specific shortlist.
    """

    supabase = get_supabase_client()

    official_id = validate_uuid(
        official.id,
        "Official ID",
    )

    athlete_id = validate_uuid(
        body.athlete_id,
        "Athlete ID",
    )

    sport = validate_sport(body.sport)

    if official_id == athlete_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "SELF_SHORTLIST_NOT_ALLOWED",
                    "message": (
                        "An official cannot shortlist "
                        "their own account."
                    ),
                },
            },
        )

    try:
        # Target user must exist and must be an athlete.
        user_result = (
            supabase.table("users")
            .select("id, name, email, role")
            .eq("id", athlete_id)
            .maybe_single()
            .execute()
        )

        athlete_user = user_result.data

        if not athlete_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "ATHLETE_NOT_FOUND",
                        "message": "Athlete was not found.",
                    },
                },
            )

        if athlete_user.get("role") != "athlete":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_TARGET_ROLE",
                        "message": (
                            "Only athlete accounts can "
                            "be shortlisted."
                        ),
                    },
                },
            )

        # Database unique constraint:
        # official_id + athlete_id + sport
        existing_result = (
            supabase.table("shortlists")
            .select("*")
            .eq("official_id", official_id)
            .eq("athlete_id", athlete_id)
            .eq("sport", sport)
            .maybe_single()
            .execute()
        )

        if existing_result.data:
            # Idempotent result: no duplicate notification.
            response.status_code = status.HTTP_200_OK

            return {
                "success": True,
                "data": {
                    "created": False,
                    "message": (
                        "Athlete is already in this "
                        "sport shortlist."
                    ),
                    "shortlist": existing_result.data,
                },
            }

        insert_result = (
            supabase.table("shortlists")
            .insert(
                {
                    "official_id": official_id,
                    "athlete_id": athlete_id,
                    "sport": sport,
                }
            )
            .execute()
        )

        if not insert_result.data:
            raise ValueError(
                "Shortlist insert returned no data."
            )

        created = insert_result.data[0]

        # Notify athlete only for a newly-created shortlist.
        try:
            (
                supabase.table("notifications")
                .insert(
                    {
                        "user_id": athlete_id,
                        "message": (
                            "An official shortlisted you "
                            f"for {sport} talent selection! ⭐"
                        ),
                        "type": "shortlisted",
                    }
                )
                .execute()
            )
        except Exception as notification_error:
            logger.warning(
                "Shortlist notification failed "
                "for athlete %s: %s",
                athlete_id,
                notification_error,
            )

        logger.info(
            "Official %s shortlisted athlete %s "
            "for %s",
            official_id,
            athlete_id,
            sport,
        )

        return {
            "success": True,
            "data": {
                "created": True,
                "message": (
                    "Athlete added to shortlist."
                ),
                "shortlist": created,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Shortlist creation failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "SHORTLIST_FAILED",
                    "message": (
                        "Could not add athlete "
                        "to shortlist."
                    ),
                },
            },
        )


# ---------------------------------------------------------------------------
# GET /shortlists/mine
# ---------------------------------------------------------------------------

@router.get("/mine")
async def get_my_shortlist(
    official: AuthenticatedUser = Depends(
        require_official
    ),
):
    """
    Returns shortlist records belonging only to the
    authenticated official.
    """

    supabase = get_supabase_client()

    official_id = validate_uuid(
        official.id,
        "Official ID",
    )

    try:
        result = (
            supabase.table("shortlists")
            .select("*")
            .eq("official_id", official_id)
            .order("created_at", desc=True)
            .execute()
        )

        shortlist_rows = result.data or []
        enriched_rows: list[dict] = []

        for raw_item in shortlist_rows:
            item = dict(raw_item)
            athlete_id = item.get("athlete_id")

            if not athlete_id:
                continue

            user_result = (
                supabase.table("users")
                .select(
                    "id, name, email, role, created_at"
                )
                .eq("id", athlete_id)
                .maybe_single()
                .execute()
            )

            profile_result = (
                supabase.table("athlete_profiles")
                .select(
                    "age, gender, location, bio, "
                    "primary_sport, height_cm, "
                    "weight_kg, experience_level"
                )
                .eq("user_id", athlete_id)
                .maybe_single()
                .execute()
            )

            athlete = dict(user_result.data or {})

            athlete["athlete_profile"] = (
                profile_result.data or {}
            )

            item["athlete"] = athlete
            enriched_rows.append(item)

        return {
            "success": True,
            "data": enriched_rows,
            "meta": {
                "total": len(enriched_rows),
            },
        }

    except Exception as exc:
        logger.exception(
            "Fetch shortlist failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "FETCH_FAILED",
                    "message": (
                        "Could not fetch shortlist."
                    ),
                },
            },
        )


# ---------------------------------------------------------------------------
# DELETE /shortlists/{athlete_id}?sport=...
# ---------------------------------------------------------------------------

@router.delete("/{athlete_id}")
async def remove_from_shortlist(
    athlete_id: str,
    sport: ShortlistSport = Query(...),
    official: AuthenticatedUser = Depends(
        require_official
    ),
):
    """
    Removes one sport-specific shortlist record owned by
    the authenticated official.
    """

    supabase = get_supabase_client()

    official_id = validate_uuid(
        official.id,
        "Official ID",
    )

    normalized_athlete_id = validate_uuid(
        athlete_id,
        "Athlete ID",
    )

    normalized_sport = validate_sport(sport)

    try:
        existing_result = (
            supabase.table("shortlists")
            .select("id, athlete_id, sport")
            .eq("official_id", official_id)
            .eq("athlete_id", normalized_athlete_id)
            .eq("sport", normalized_sport)
            .maybe_single()
            .execute()
        )

        existing = existing_result.data

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "SHORTLIST_NOT_FOUND",
                        "message": (
                            "Athlete is not in your "
                            "selected sport shortlist."
                        ),
                    },
                },
            )

        (
            supabase.table("shortlists")
            .delete()
            .eq("id", existing["id"])
            .eq("official_id", official_id)
            .execute()
        )

        logger.info(
            "Official %s removed athlete %s "
            "from %s",
            official_id,
            normalized_athlete_id,
            normalized_sport,
        )

        return {
            "success": True,
            "data": {
                "message": (
                    "Athlete removed from shortlist."
                ),
                "removed_id": existing["id"],
                "athlete_id": normalized_athlete_id,
                "sport": normalized_sport,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Remove shortlist failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "REMOVE_FAILED",
                    "message": (
                        "Could not remove athlete "
                        "from shortlist."
                    ),
                },
            },
        )