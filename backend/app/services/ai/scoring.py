"""
ATHLETIX — Scoring Engine
services/ai/scoring.py

Aggregates per-exercise metrics into a final score + feedback report.

Score structure returned:
    {
        "score":       float (0–100),
        "strengths":   list[str],
        "weaknesses":  list[str],
        "suggestions": list[str],
        "rep_count":   int | None   (calisthenics only)
    }

Rules (Rules.md §8):
  - Ambiguous thresholds are DOCUMENTED here, not buried silently
  - All assumptions about scoring weights are explicit
"""

import logging
from typing import Any

logger = logging.getLogger("athletix.ai.scoring")


def compute_score(exercise: str, metrics: dict[str, Any]) -> dict[str, Any]:
    """
    Converts raw exercise metrics into a structured performance report.

    Args:
        exercise: Exercise key (e.g. 'squat', 'pushup')
        metrics:  Dict from the exercise-specific extractor

    Returns:
        Dict with score, strengths, weaknesses, suggestions, rep_count
    """
    # TODO (Phase 4): Implement real weighted scoring per exercise
    # The structure below defines the contract that all exercises must follow.
    logger.warning("scoring.compute_score is a stub — returning placeholder result (Phase 4 TODO)")

    return {
        "score":       0.0,           # TODO: real weighted score
        "strengths":   [],            # TODO: populate from metrics above threshold
        "weaknesses":  [],            # TODO: populate from metrics below threshold
        "suggestions": [],            # TODO: generate from weaknesses
        "rep_count":   metrics.get("rep_count"),  # None for powerlifting
    }
