"""
ATHLETIX — Scouting, Leaderboard and Verification Schemas
models/scouting.py

Contains request and response schemas for:
- Leaderboard
- Direct official verification
- Athlete verification request workflow
- Admin approve/reject workflow
- Shortlists
"""

from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

class LeaderboardEntry(BaseModel):
    sport: str
    exercise: str
    athlete_id: str
    athlete_name: str
    athlete_location: str | None = None
    score: float
    rep_count: int | None = None
    assessed_at: str
    rank: int
    is_verified: bool = False


# ---------------------------------------------------------------------------
# Existing direct official verification
# ---------------------------------------------------------------------------

class VerifyRequest(BaseModel):
    athlete_id: str
    video_id: str
    exercise: str

    @field_validator(
        "athlete_id",
        "video_id",
        "exercise",
    )
    @classmethod
    def verification_fields_not_empty(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(
                "Field cannot be blank."
            )

        return cleaned


class VerificationResponseItem(BaseModel):
    id: str
    athlete_id: str
    official_id: str
    video_id: str
    exercise: str
    verified_at: str


# ---------------------------------------------------------------------------
# Athlete verification request workflow
# ---------------------------------------------------------------------------

VerificationRequestStatus = Literal[
    "pending",
    "approved",
    "rejected",
]

VerificationReviewStatus = Literal[
    "approved",
    "rejected",
]


class VerificationReviewRequest(BaseModel):
    """
    Admin payload for approving or rejecting a request.
    """

    status: VerificationReviewStatus

    review_note: str | None = Field(
        default=None,
        max_length=500,
    )

    @field_validator("review_note")
    @classmethod
    def clean_review_note(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None

    @model_validator(mode="after")
    def validate_review_decision(
        self,
    ):
        if (
            self.status == "rejected"
            and (
                self.review_note is None
                or len(self.review_note) < 3
            )
        ):
            raise ValueError(
                "A rejection reason of at least "
                "3 characters is required."
            )

        return self


class VerificationRequestItem(BaseModel):
    """
    Verification request returned by backend.
    """

    id: str
    athlete_id: str
    video_id: str
    exercise: str

    details: str
    document_paths: list[str]

    status: VerificationRequestStatus

    reviewed_by: str | None = None
    review_note: str | None = None

    created_at: str
    updated_at: str
    reviewed_at: str | None = None


class VerificationDocumentItem(BaseModel):
    """
    Temporary signed document URL returned to authorized users.
    """

    path: str
    signed_url: str
    expires_in: int


# ---------------------------------------------------------------------------
# Shortlist
# ---------------------------------------------------------------------------

class ShortlistRequest(BaseModel):
    athlete_id: str

    sport: Literal[
        "powerlifting",
        "calisthenics",
    ]

    @field_validator("athlete_id")
    @classmethod
    def athlete_id_not_empty(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(
                "Athlete ID cannot be blank."
            )

        return cleaned


class ShortlistResponseItem(BaseModel):
    id: str
    official_id: str
    athlete_id: str
    sport: str
    created_at: str
    athlete: dict | None = None