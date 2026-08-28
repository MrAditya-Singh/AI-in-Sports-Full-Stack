"""
ATHLETIX — Scoring Engine
services/ai/scoring.py

Converts exercise-specific metrics into:
- score (0–100)
- strengths
- weaknesses
- suggestions
- rep_count

Supports 9 exercises:
  ai-gym-coach: squat, pushup, biceps_curl, shoulder_press, lunges
  ATHLETIX:     bench_press, deadlift, pullup, handstand
"""

import logging
import math
from collections.abc import Mapping, Sequence
from typing import Any

logger = logging.getLogger("athletix.ai.scoring")

SUPPORTED_EXERCISES = {
    # ai-gym-coach detectors
    "squat",
    "pushup",
    "biceps_curl",
    "shoulder_press",
    "lunges",
    # Original ATHLETIX extractors
    "bench_press",
    "deadlift",
    "pullup",
    "handstand",
}


def _normalise_exercise(exercise: str) -> str:
    if not isinstance(exercise, str) or not exercise.strip():
        raise ValueError("Exercise name is required.")

    return exercise.strip().lower().replace(" ", "_").replace("-", "_")


def _number(
    metrics: Mapping[str, Any],
    key: str,
    default: float,
    *,
    minimum: float | None = None,
    maximum: float | None = None,
) -> float:
    """
    Safely reads a numeric metric.

    Handles None, invalid strings, booleans, NaN and infinity.
    """
    raw_value = metrics.get(key, default)

    if raw_value is None or isinstance(raw_value, bool):
        value = default
    else:
        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            logger.warning(
                "Invalid numeric metric %s=%r. Using default=%s",
                key,
                raw_value,
                default,
            )
            value = default

    if not math.isfinite(value):
        value = default

    if minimum is not None:
        value = max(minimum, value)

    if maximum is not None:
        value = min(maximum, value)

    return value


def _text(metrics: Mapping[str, Any], key: str) -> str:
    value = metrics.get(key)

    if value is None:
        return ""

    return str(value).strip().upper()


def _form_issues(metrics: Mapping[str, Any]) -> list[str]:
    """
    Converts form_issues into a safe list of strings.

    Prevents malformed extractor output from breaking scoring.
    """
    raw_issues = metrics.get("form_issues")

    if raw_issues is None:
        return []

    if isinstance(raw_issues, str):
        cleaned = raw_issues.strip()
        return [cleaned] if cleaned else []

    if isinstance(raw_issues, Sequence):
        return [
            str(issue).strip()
            for issue in raw_issues
            if issue is not None and str(issue).strip()
        ]

    logger.warning("Invalid form_issues value received: %r", raw_issues)
    return []


def _rep_count(metrics: Mapping[str, Any]) -> int | None:
    raw_count = metrics.get("rep_count")

    if raw_count is None or isinstance(raw_count, bool):
        return None

    try:
        value = int(float(raw_count))
    except (TypeError, ValueError):
        logger.warning("Invalid rep_count received: %r", raw_count)
        return None

    return max(0, value)


def _append_unique(items: list[str], value: str) -> None:
    if value and value not in items:
        items.append(value)


def compute_score(
    exercise: str,
    metrics: Mapping[str, Any] | None,
) -> dict[str, Any]:
    """
    Converts raw exercise metrics into a structured performance report.
    """
    exercise_key = _normalise_exercise(exercise)

    if exercise_key not in SUPPORTED_EXERCISES:
        raise ValueError(f"Unsupported exercise for scoring: {exercise_key}")

    if metrics is None:
        raise ValueError(
            f"No metrics were extracted for exercise '{exercise_key}'. "
            "Pose landmarks may not have been detected."
        )

    if not isinstance(metrics, Mapping):
        raise TypeError(
            "Exercise extractor must return a dictionary/mapping, "
            f"received {type(metrics).__name__}."
        )

    if not metrics:
        raise ValueError(
            f"Empty metrics were extracted for exercise '{exercise_key}'."
        )

    form_issues = _form_issues(metrics)
    rep_count = _rep_count(metrics)

    score = 85.0

    # ── Squat ────────────────────────────────────────────────────────────
    if exercise_key == "squat":
        depth_pct = _number(
            metrics, "good_depth_pct", 50, minimum=0, maximum=100,
        )
        score = 40 + (depth_pct * 0.4)

        avg_back = _number(
            metrics, "avg_back_angle", 160, minimum=0, maximum=180,
        )

        if avg_back >= 150:
            score += 15
        elif avg_back >= 140:
            score += 8

    # ── Pushup ───────────────────────────────────────────────────────────
    elif exercise_key == "pushup":
        straight_pct = _number(
            metrics, "straight_body_pct", 50, minimum=0, maximum=100,
        )
        score = 35 + (straight_pct * 0.45)

        if _text(metrics, "hip_status") == "LEVEL":
            score += 15

    # ── Biceps Curl (NEW — ai-gym-coach) ─────────────────────────────────
    elif exercise_key == "biceps_curl":
        stable_pct = _number(
            metrics, "stable_pct", 50, minimum=0, maximum=100,
        )
        no_swing_pct = _number(
            metrics, "no_swing_pct", 50, minimum=0, maximum=100,
        )

        # Base score from shoulder stability
        score = 40 + (stable_pct * 0.3)

        # Bonus for controlled movement (no swinging)
        if no_swing_pct >= 70:
            score += 15
        elif no_swing_pct >= 50:
            score += 8

        if _text(metrics, "swing_status") == "CONTROLLED":
            score += 5

    # ── Shoulder Press (NEW — ai-gym-coach) ──────────────────────────────
    elif exercise_key == "shoulder_press":
        full_ext_pct = _number(
            metrics, "full_extension_pct", 30, minimum=0, maximum=100,
        )
        score = 40 + (full_ext_pct * 0.35)

        if _text(metrics, "extension_status") == "GOOD":
            score += 15

        if _text(metrics, "back_arch_status") == "NEUTRAL":
            score += 10

    # ── Lunges (NEW — ai-gym-coach) ──────────────────────────────────────
    elif exercise_key == "lunges":
        balanced_pct = _number(
            metrics, "balanced_pct", 50, minimum=0, maximum=100,
        )
        avg_torso = _number(
            metrics, "avg_torso_angle", 160, minimum=0, maximum=180,
        )

        score = 40 + (balanced_pct * 0.3)

        if avg_torso >= 160:
            score += 15
        elif avg_torso >= 150:
            score += 8

        if _text(metrics, "balance_status") == "BALANCED":
            score += 5

    # ── Bench Press (original) ───────────────────────────────────────────
    elif exercise_key == "bench_press":
        score = 70

        if _text(metrics, "extension_status") == "GOOD":
            score += 15

        if _text(metrics, "back_arch_status") == "NEUTRAL":
            score += 10

    # ── Deadlift (original) ──────────────────────────────────────────────
    elif exercise_key == "deadlift":
        score = 60

        if _text(metrics, "lockout_status") == "GOOD":
            score += 20

        avg_torso = _number(
            metrics, "avg_torso_angle", 140, minimum=0, maximum=180,
        )

        if avg_torso >= 150:
            score += 15

    # ── Pullup (original) ────────────────────────────────────────────────
    elif exercise_key == "pullup":
        score = 65

        if _text(metrics, "swing_status") == "CONTROLLED":
            score += 18

        if _text(metrics, "shoulder_status") == "STABLE":
            score += 12

    # ── Handstand (original) ─────────────────────────────────────────────
    elif exercise_key == "handstand":
        alignment_pct = _number(
            metrics, "alignment_pct", 0, minimum=0, maximum=100,
        )
        score = 30 + (alignment_pct * 0.6)

    # ── Deduct for form issues ───────────────────────────────────────────
    score -= len(form_issues) * 5
    score = round(max(0, min(100, score)), 1)

    # ── Build strengths list ─────────────────────────────────────────────
    strengths: list[str] = []

    if score >= 80:
        _append_unique(strengths, "Excellent overall form and technique")

    if rep_count is not None and rep_count > 5:
        _append_unique(
            strengths,
            f"Strong endurance — completed {rep_count} reps",
        )

    if not form_issues:
        _append_unique(strengths, "No significant form issues detected")

    # Exercise-specific strengths
    if exercise_key == "squat" and _text(metrics, "depth_status") == "GOOD":
        _append_unique(strengths, "Excellent squat depth — below parallel")

    if exercise_key == "pushup" and _text(metrics, "body_alignment") == "GOOD":
        _append_unique(
            strengths,
            "Strong plank position maintained throughout",
        )

    if exercise_key == "pullup" and _text(metrics, "swing_status") == "CONTROLLED":
        _append_unique(
            strengths,
            "Controlled movement without swinging",
        )

    if exercise_key == "deadlift" and _text(metrics, "lockout_status") == "GOOD":
        _append_unique(strengths, "Clean hip lockout at the top")

    if exercise_key == "biceps_curl" and _text(metrics, "swing_status") == "CONTROLLED":
        _append_unique(
            strengths,
            "Strict curl form with no body swing",
        )

    if exercise_key == "biceps_curl" and _text(metrics, "shoulder_status") == "STABLE":
        _append_unique(
            strengths,
            "Elbows remain pinned — great isolation",
        )

    if exercise_key == "shoulder_press" and _text(metrics, "extension_status") == "GOOD":
        _append_unique(
            strengths,
            "Full overhead extension achieved",
        )

    if exercise_key == "shoulder_press" and _text(metrics, "back_arch_status") == "NEUTRAL":
        _append_unique(
            strengths,
            "Neutral spine maintained — no excessive arch",
        )

    if exercise_key == "lunges" and _text(metrics, "balance_status") == "BALANCED":
        _append_unique(
            strengths,
            "Excellent balance and lateral stability",
        )

    # ── Build weaknesses and suggestions ─────────────────────────────────
    weaknesses = list(form_issues)
    suggestions: list[str] = []

    for issue in form_issues:
        issue_lower = issue.lower()

        if "depth" in issue_lower:
            suggestion = "Practice box squats to build depth confidence"
        elif "lean" in issue_lower:
            suggestion = "Strengthen core and upper back for better posture"
        elif "hip" in issue_lower or "sag" in issue_lower:
            suggestion = "Practice plank holds to build core stability"
        elif "swing" in issue_lower:
            suggestion = "Use slower tempo and avoid momentum"
        elif "lockout" in issue_lower:
            suggestion = "Focus on full range of motion at the top"
        elif "arch" in issue_lower:
            suggestion = "Engage core to maintain neutral spine position"
        elif "elbow" in issue_lower or "drift" in issue_lower:
            suggestion = "Keep elbows close to body, use lighter weight"
        elif "extension" in issue_lower:
            suggestion = "Press fully overhead with controlled movement"
        elif "balance" in issue_lower:
            suggestion = "Widen stance slightly and engage core for stability"
        elif "torso" in issue_lower or "upright" in issue_lower:
            suggestion = "Keep chest upright — focus on a fixed point ahead"
        elif "alignment" in issue_lower or "plank" in issue_lower:
            suggestion = "Practice plank holds to improve body alignment"
        else:
            suggestion = "Focus on controlled, deliberate movement patterns"

        _append_unique(suggestions, suggestion)

    if not suggestions and score < 85:
        suggestions.append(
            "Continue practicing with focus on form consistency"
        )

    return {
        "score": score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "rep_count": rep_count,
    }