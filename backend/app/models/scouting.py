"""
ATHLETIX — Pydantic Schemas: Scouting, Leaderboard, Verifications & Shortlists
models/scouting.py

Request and response schemas for Phase 6 endpoints.
"""

from pydantic import BaseModel, field_validator
from typing import Literal

# ─────────────────────────────────────────────────────────────────────────────
# Leaderboard
# ─────────────────────────────────────────────────────────────────────────────
class LeaderboardEntry(BaseModel):
    sport:            str
    exercise:         str
    athlete_id:       str
    athlete_name:     str
    athlete_location: str | None = None
    score:            float
    rep_count:        int | None  = None
    assessed_at:      str
    rank:             int
    is_verified:      bool = False


# ─────────────────────────────────────────────────────────────────────────────
# Verification Request / Response
# ─────────────────────────────────────────────────────────────────────────────
class VerifyRequest(BaseModel):
    athlete_id: str
    video_id:   str
    exercise:   str

    @field_validator("athlete_id", "video_id", "exercise")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank.")
        return v.strip()


class VerificationResponseItem(BaseModel):
    id:          str
    athlete_id:  str
    official_id: str
    video_id:    str
    exercise:    str
    verified_at: str


# ─────────────────────────────────────────────────────────────────────────────
# Shortlist Request / Response
# ─────────────────────────────────────────────────────────────────────────────
class ShortlistRequest(BaseModel):
    athlete_id: str
    sport:      Literal["powerlifting", "calisthenics"]

    @field_validator("athlete_id")
    @classmethod
    def id_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Athlete ID cannot be blank.")
        return v.strip()


class ShortlistResponseItem(BaseModel):
    id:          str
    official_id: str
    athlete_id:  str
    sport:       str
    created_at:  str
    athlete:     dict | None = None
