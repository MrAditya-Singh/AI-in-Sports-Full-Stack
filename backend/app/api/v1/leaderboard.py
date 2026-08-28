"""
ATHLETIX — Leaderboard Routes
api/v1/leaderboard.py

Endpoints:
  GET /api/v1/leaderboard
      Global or sport/exercise filtered leaderboard

  GET /api/v1/leaderboard/me
      Current authenticated athlete's leaderboard position
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import AuthenticatedUser, get_current_user
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("athletix.leaderboard")
router = APIRouter()

# Maximum rows fetched before unique-player ranking.
MAX_VIEW_ROWS = 1000


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise_filter(value: Optional[str]) -> Optional[str]:
    """
    Converts blank/all/global values into None.

    Example:
        "Bench Press" -> "bench_press"
        "all"         -> None
    """
    if value is None:
        return None

    cleaned = (
        value.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )

    if cleaned in {"", "all", "global"}:
        return None

    return cleaned


def _get_score(row: dict[str, Any]) -> float:
    """
    Safely converts Supabase numeric/Decimal/string score to float.
    """
    try:
        return float(row.get("score") or 0)
    except (TypeError, ValueError):
        return 0.0


def _prepare_ranked_rows(
    raw_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Creates final unique-player leaderboard.

    CHANGED:
    - One athlete appears only once in filtered leaderboard.
    - Athlete's highest score is selected.
    - Latest assessment wins when scores are equal.
    - Equal scores receive equal rank: 1, 1, 3.
    """
    best_by_athlete: dict[str, dict[str, Any]] = {}

    for raw_row in raw_rows:
        if not isinstance(raw_row, dict):
            continue

        athlete_id = raw_row.get("athlete_id")

        if athlete_id is None:
            continue

        athlete_key = str(athlete_id)

        row = dict(raw_row)
        row["athlete_id"] = athlete_key
        row["score"] = _get_score(row)
        row["is_verified"] = bool(
            row.get("is_verified", False)
        )

        current_best = best_by_athlete.get(athlete_key)

        if current_best is None:
            best_by_athlete[athlete_key] = row
            continue

        row_score = _get_score(row)
        current_best_score = _get_score(current_best)

        # Higher score becomes athlete's leaderboard entry.
        if row_score > current_best_score:
            best_by_athlete[athlete_key] = row
            continue

        # Equal score: keep latest assessment.
        if row_score == current_best_score:
            row_date = str(row.get("assessed_at") or "")
            current_date = str(
                current_best.get("assessed_at") or ""
            )

            if row_date > current_date:
                best_by_athlete[athlete_key] = row

    ranked_rows = sorted(
        best_by_athlete.values(),
        key=lambda item: (
            _get_score(item),
            str(item.get("assessed_at") or ""),
        ),
        reverse=True,
    )

    previous_score: Optional[float] = None
    previous_rank = 0

    for index, row in enumerate(ranked_rows):
        score = _get_score(row)

        # Competition ranking:
        # 100, 100, 90 -> ranks 1, 1, 3
        if previous_score is None or score != previous_score:
            previous_rank = index + 1
            previous_score = score

        row["rank"] = previous_rank

    return ranked_rows


def _build_leaderboard_query(
    sport: Optional[str],
    exercise: Optional[str],
):
    """
    Creates leaderboard_view Supabase query.
    """
    supabase = get_supabase_client()

    query = supabase.table("leaderboard_view").select(
        (
            "sport,"
            "exercise,"
            "athlete_id,"
            "athlete_name,"
            "athlete_location,"
            "score,"
            "rep_count,"
            "assessed_at,"
            "rank,"
            "is_verified"
        )
    )

    if sport:
        query = query.eq("sport", sport)

    if exercise:
        query = query.eq("exercise", exercise)

    return query


# ---------------------------------------------------------------------------
# GET /leaderboard
# ---------------------------------------------------------------------------

@router.get("")
async def get_leaderboard(
    sport: Optional[str] = Query(
        default=None,
        description=(
            "Filter by sport. Use all/global or leave blank "
            "for global leaderboard."
        ),
    ),
    exercise: Optional[str] = Query(
        default=None,
        description=(
            "Filter by exercise. Use all or leave blank "
            "for all exercises."
        ),
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
):
    """
    Returns global or category-filtered leaderboard.

    Global:
        Every athlete appears once using their highest score.

    Filtered:
        Every athlete appears once using their highest matching score.
    """
    sport_filter = _normalise_filter(sport)
    exercise_filter = _normalise_filter(exercise)

    try:
        result = (
            _build_leaderboard_query(
                sport=sport_filter,
                exercise=exercise_filter,
            )
            .order("score", desc=True)
            .limit(MAX_VIEW_ROWS)
            .execute()
        )

        raw_rows = result.data or []

        if not isinstance(raw_rows, list):
            raise RuntimeError(
                "Leaderboard view returned an invalid response."
            )

        ranked_rows = _prepare_ranked_rows(raw_rows)
        response_rows = ranked_rows[:limit]

        return {
            "success": True,
            "data": response_rows,
            "meta": {
                "sport": sport_filter or "global",
                "exercise": exercise_filter or "all",
                "returned": len(response_rows),
                "total_ranked": len(ranked_rows),
            },
        }

    except Exception as exc:
        logger.exception(
            "Leaderboard query failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "LEADERBOARD_ERROR",
                    "message": (
                        "Could not fetch leaderboard data."
                    ),
                },
            },
        ) from exc


# ---------------------------------------------------------------------------
# GET /leaderboard/me
# ---------------------------------------------------------------------------

@router.get("/me")
async def get_my_ranking(
    sport: Optional[str] = Query(
        default=None,
        description="Optional sport filter.",
    ),
    exercise: Optional[str] = Query(
        default=None,
        description="Optional exercise filter.",
    ),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Returns authenticated user's position in selected leaderboard.
    """
    sport_filter = _normalise_filter(sport)
    exercise_filter = _normalise_filter(exercise)

    try:
        result = (
            _build_leaderboard_query(
                sport=sport_filter,
                exercise=exercise_filter,
            )
            .order("score", desc=True)
            .limit(MAX_VIEW_ROWS)
            .execute()
        )

        raw_rows = result.data or []

        if not isinstance(raw_rows, list):
            raise RuntimeError(
                "Leaderboard view returned an invalid response."
            )

        ranked_rows = _prepare_ranked_rows(raw_rows)
        current_user_id = str(user.id)

        user_entry: Optional[dict[str, Any]] = next(
            (
                row
                for row in ranked_rows
                if str(row.get("athlete_id"))
                == current_user_id
            ),
            None,
        )

        return {
            "success": True,
            "data": {
                "is_ranked": user_entry is not None,
                "rank": (
                    user_entry.get("rank")
                    if user_entry is not None
                    else None
                ),
                "entry": user_entry,
                "total_ranked": len(ranked_rows),
                "sport": sport_filter or "global",
                "exercise": exercise_filter or "all",
            },
        }

    except Exception as exc:
        logger.exception(
            "My-ranking query failed for user=%s: %s",
            user.id,
            exc,
        )

        # CHANGED:
        # Database errors are no longer silently returned as "not ranked".
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "MY_RANK_ERROR",
                    "message": (
                        "Could not fetch your leaderboard position."
                    ),
                },
            },
        ) from exc