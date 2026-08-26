"""
ATHLETIX — Deadlift Metric Extractor (Phase 5: FULLY IMPLEMENTED)
services/ai/exercises/deadlift.py

Sport: Powerlifting
Adapted from LungesDetector pattern — hip hinge, torso angle, balance.
"""

import math
import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.deadlift")

LEFT_HIP, LEFT_KNEE, LEFT_ANKLE = 23, 25, 27
RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE = 24, 26, 28
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12

DOWN_THRESHOLD = 100
UP_THRESHOLD = 160
MIN_VISIBILITY = 0.7


def _angle(a, b, c):
    ax, ay = a[0] - b[0], a[1] - b[1]
    cx, cy = c[0] - b[0], c[1] - b[1]
    dot = ax * cx + ay * cy
    mag_a = math.sqrt(ax**2 + ay**2)
    mag_c = math.sqrt(cx**2 + cy**2)
    if mag_a * mag_c == 0:
        return 0.0
    return math.degrees(math.acos(max(-1.0, min(1.0, dot / (mag_a * mag_c)))))


def _pt(landmarks, idx):
    return (landmarks[idx]["x"], landmarks[idx]["y"])


def extract_metrics(keypoints_per_frame: list[list[dict[str, Any]]]) -> dict[str, Any]:
    if not keypoints_per_frame:
        return {"rep_count": None, "avg_hip_angle": 0, "avg_torso_angle": 0,
                "lockout_status": "N/A", "form_issues": []}

    reps = 0
    stage = None
    hip_angles = []
    torso_angles = []
    lockouts = []

    for landmarks in keypoints_per_frame:
        if len(landmarks) < 33:
            continue

        hip_angle = _angle(_pt(landmarks, LEFT_SHOULDER), _pt(landmarks, LEFT_HIP), _pt(landmarks, LEFT_KNEE))
        torso_angle = _angle(_pt(landmarks, LEFT_SHOULDER), _pt(landmarks, LEFT_HIP), _pt(landmarks, LEFT_ANKLE))

        key_visible = (landmarks[LEFT_HIP].get("visibility", 0) >= MIN_VISIBILITY and
                       landmarks[LEFT_KNEE].get("visibility", 0) >= MIN_VISIBILITY and
                       landmarks[LEFT_SHOULDER].get("visibility", 0) >= MIN_VISIBILITY)

        if key_visible:
            if hip_angle < DOWN_THRESHOLD:
                stage = "down"
            if hip_angle >= UP_THRESHOLD and stage == "down":
                stage = "up"
                reps += 1

        hip_angles.append(hip_angle)
        torso_angles.append(torso_angle)
        lockouts.append("LOCKED" if hip_angle >= UP_THRESHOLD else "BENDING")

    avg_hip = sum(hip_angles) / len(hip_angles) if hip_angles else 0
    avg_torso = sum(torso_angles) / len(torso_angles) if torso_angles else 0
    lockout_pct = lockouts.count("LOCKED") / len(lockouts) * 100 if lockouts else 0

    form_issues = []
    if avg_torso < 130:
        form_issues.append("Excessive forward lean — drive hips forward at the top")
    if lockout_pct < 20:
        form_issues.append("Incomplete lockout — fully extend hips at the top")

    return {
        "rep_count": None,
        "avg_hip_angle": round(avg_hip, 1),
        "avg_torso_angle": round(avg_torso, 1),
        "lockout_status": "GOOD" if lockout_pct >= 20 else "INCOMPLETE",
        "form_issues": form_issues,
    }
