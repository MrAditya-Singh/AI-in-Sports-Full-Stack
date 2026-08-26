"""
ATHLETIX — Squat Metric Extractor (Phase 5: FULLY IMPLEMENTED)
services/ai/exercises/squat.py

Sport: Powerlifting
Ported from ai-gym-coach SquatDetector.
"""

import math
import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.squat")

LEFT_HIP, LEFT_KNEE, LEFT_ANKLE = 23, 25, 27
RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE = 24, 26, 28
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12

DOWN_THRESHOLD = 100
UP_THRESHOLD = 160
MIN_VISIBILITY = 0.7


def _angle(a: tuple, b: tuple, c: tuple) -> float:
    ax, ay = a[0] - b[0], a[1] - b[1]
    cx, cy = c[0] - b[0], c[1] - b[1]
    dot = ax * cx + ay * cy
    mag_a = math.sqrt(ax**2 + ay**2)
    mag_c = math.sqrt(cx**2 + cy**2)
    if mag_a * mag_c == 0:
        return 0.0
    cos_angle = max(-1.0, min(1.0, dot / (mag_a * mag_c)))
    return math.degrees(math.acos(cos_angle))


def _pt(landmarks: list[dict], idx: int) -> tuple:
    lm = landmarks[idx]
    return (lm["x"], lm["y"])


def extract_metrics(keypoints_per_frame: list[list[dict[str, Any]]]) -> dict[str, Any]:
    """Extracts Squat-specific metrics from BlazePose keypoints."""
    if not keypoints_per_frame:
        return {"rep_count": 0, "avg_knee_angle": 0, "avg_back_angle": 0,
                "depth_status": "N/A", "form_issues": []}

    reps = 0
    stage = None
    knee_angles = []
    back_angles = []
    depth_statuses = []

    for landmarks in keypoints_per_frame:
        if len(landmarks) < 33:
            continue

        left_knee_angle = _angle(_pt(landmarks, LEFT_HIP), _pt(landmarks, LEFT_KNEE), _pt(landmarks, LEFT_ANKLE))
        right_knee_angle = _angle(_pt(landmarks, RIGHT_HIP), _pt(landmarks, RIGHT_KNEE), _pt(landmarks, RIGHT_ANKLE))

        left_vis = landmarks[LEFT_KNEE].get("visibility", 0)
        right_vis = landmarks[RIGHT_KNEE].get("visibility", 0)

        if left_vis >= right_vis:
            knee_angle = left_knee_angle
            hip_idx, knee_idx, ankle_idx, shoulder_idx = LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_SHOULDER
        else:
            knee_angle = right_knee_angle
            hip_idx, knee_idx, ankle_idx, shoulder_idx = RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_SHOULDER

        back_angle = _angle(_pt(landmarks, shoulder_idx), _pt(landmarks, hip_idx), _pt(landmarks, knee_idx))

        key_visible = (landmarks[hip_idx].get("visibility", 0) >= MIN_VISIBILITY and
                       landmarks[knee_idx].get("visibility", 0) >= MIN_VISIBILITY and
                       landmarks[ankle_idx].get("visibility", 0) >= MIN_VISIBILITY)

        if key_visible:
            if knee_angle < DOWN_THRESHOLD:
                stage = "down"
            if knee_angle >= UP_THRESHOLD and stage == "down":
                stage = "up"
                reps += 1

        knee_angles.append(knee_angle)
        back_angles.append(back_angle)

        if stage == "down":
            depth_statuses.append("GOOD DEPTH" if knee_angle <= DOWN_THRESHOLD else "TOO HIGH")
        elif stage == "up":
            depth_statuses.append("STANDING")

    avg_knee = sum(knee_angles) / len(knee_angles) if knee_angles else 0
    avg_back = sum(back_angles) / len(back_angles) if back_angles else 0
    good_depth_pct = depth_statuses.count("GOOD DEPTH") / len(depth_statuses) * 100 if depth_statuses else 0

    form_issues = []
    if avg_back < 140:
        form_issues.append("Excessive forward lean — keep chest up")
    if good_depth_pct < 50:
        form_issues.append("Insufficient squat depth — aim for parallel or below")

    return {
        "rep_count": reps,
        "avg_knee_angle": round(avg_knee, 1),
        "avg_back_angle": round(avg_back, 1),
        "depth_status": "GOOD" if good_depth_pct >= 50 else "SHALLOW",
        "good_depth_pct": round(good_depth_pct, 1),
        "form_issues": form_issues,
    }
