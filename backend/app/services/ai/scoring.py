"""
ATHLETIX — Scoring Engine (Phase 4: FULLY IMPLEMENTED)
services/ai/scoring.py

Aggregates per-exercise metrics into a final score (0–100) + feedback report.
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
    form_issues = metrics.get("form_issues", [])
    rep_count = metrics.get("rep_count")

    # Base score starts at 85 — deduct for each form issue
    score = 85.0

    # Exercise-specific scoring adjustments
    if exercise == "squat":
        depth_pct = metrics.get("good_depth_pct", 50)
        score = 40 + (depth_pct * 0.4)  # 40–80 from depth
        avg_back = metrics.get("avg_back_angle", 160)
        if avg_back >= 150:
            score += 15  # good posture bonus
        elif avg_back >= 140:
            score += 8

    elif exercise == "pushup":
        straight_pct = metrics.get("straight_body_pct", 50)
        score = 35 + (straight_pct * 0.45)  # 35–80 from alignment
        if metrics.get("hip_status") == "LEVEL":
            score += 15

    elif exercise == "bench_press":
        ext = metrics.get("extension_status", "")
        arch = metrics.get("back_arch_status", "")
        score = 70
        if ext == "GOOD":
            score += 15
        if arch == "NEUTRAL":
            score += 10

    elif exercise == "deadlift":
        lockout = metrics.get("lockout_status", "")
        avg_torso = metrics.get("avg_torso_angle", 140)
        score = 60
        if lockout == "GOOD":
            score += 20
        if avg_torso >= 150:
            score += 15

    elif exercise == "pullup":
        swing = metrics.get("swing_status", "")
        shoulder = metrics.get("shoulder_status", "")
        score = 65
        if swing == "CONTROLLED":
            score += 18
        if shoulder == "STABLE":
            score += 12

    elif exercise == "handstand":
        alignment_pct = metrics.get("alignment_pct", 0)
        score = 30 + (alignment_pct * 0.6)  # 30–90 from alignment

    # Deduct for form issues
    score -= len(form_issues) * 5
    score = max(0, min(100, round(score, 1)))

    # Generate strengths
    strengths = []
    if score >= 80:
        strengths.append("Excellent overall form and technique")
    if rep_count and rep_count > 5:
        strengths.append(f"Strong endurance — completed {rep_count} reps")
    if not form_issues:
        strengths.append("No significant form issues detected")

    # Exercise-specific strengths
    if exercise == "squat" and metrics.get("depth_status") == "GOOD":
        strengths.append("Excellent squat depth — below parallel")
    if exercise == "pushup" and metrics.get("body_alignment") == "GOOD":
        strengths.append("Strong plank position maintained throughout")
    if exercise == "pullup" and metrics.get("swing_status") == "CONTROLLED":
        strengths.append("Controlled movement without swinging")
    if exercise == "deadlift" and metrics.get("lockout_status") == "GOOD":
        strengths.append("Clean hip lockout at the top")

    # Weaknesses = form issues
    weaknesses = list(form_issues)

    # Generate suggestions from weaknesses
    suggestions = []
    for issue in form_issues:
        if "depth" in issue.lower():
            suggestions.append("Practice box squats to build depth confidence")
        elif "lean" in issue.lower():
            suggestions.append("Strengthen core and upper back for better posture")
        elif "hip" in issue.lower() or "sag" in issue.lower():
            suggestions.append("Practice plank holds to build core stability")
        elif "swing" in issue.lower():
            suggestions.append("Use slower tempo and avoid momentum")
        elif "lockout" in issue.lower():
            suggestions.append("Focus on full range of motion at the top")
        elif "arch" in issue.lower():
            suggestions.append("Engage core to maintain neutral spine position")
        else:
            suggestions.append("Focus on controlled, deliberate movement patterns")

    if not suggestions and score < 85:
        suggestions.append("Continue practicing with focus on form consistency")

    return {
        "score": score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "rep_count": rep_count,
    }
