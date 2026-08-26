"""
ATHLETIX — Bench Press Metric Extractor (Phase 5: FULLY IMPLEMENTED)
services/ai/exercises/bench_press.py

Sport: Powerlifting
Adapted from ShoulderPressDetector pattern — elbow angle, extension, back arch.
"""

import math
import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.bench_press")

LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_KNEE, RIGHT_KNEE = 25, 26

UP_THRESHOLD = 160
DOWN_THRESHOLD = 90
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
        return {"rep_count": None, "avg_elbow_angle": 0, "extension_status": "N/A",
                "back_arch_status": "N/A", "form_issues": []}

    reps = 0
    stage = None
    elbow_angles = []
    extensions = []
    back_arches = []

    for landmarks in keypoints_per_frame:
        if len(landmarks) < 33:
            continue

        left_vis = landmarks[LEFT_ELBOW].get("visibility", 0)
        right_vis = landmarks[RIGHT_ELBOW].get("visibility", 0)

        if left_vis >= right_vis:
            s, e, w, h, k = LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST, LEFT_HIP, LEFT_KNEE
        else:
            s, e, w, h, k = RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST, RIGHT_HIP, RIGHT_KNEE

        elbow_angle = _angle(_pt(landmarks, s), _pt(landmarks, e), _pt(landmarks, w))
        back_angle = _angle(_pt(landmarks, s), _pt(landmarks, h), _pt(landmarks, k))

        key_visible = (landmarks[s].get("visibility", 0) > MIN_VISIBILITY and
                       landmarks[e].get("visibility", 0) > MIN_VISIBILITY)

        if key_visible:
            if elbow_angle > UP_THRESHOLD:
                stage = "up"
            if elbow_angle < DOWN_THRESHOLD and stage == "up":
                stage = "down"
                reps += 1

        elbow_angles.append(elbow_angle)

        if elbow_angle >= UP_THRESHOLD:
            extensions.append("FULL LOCKOUT")
        elif elbow_angle >= 130:
            extensions.append("NEARLY EXTENDED")
        else:
            extensions.append("PRESSING")

        if back_angle >= 160:
            back_arches.append("Neutral")
        elif back_angle >= 140:
            back_arches.append("Slight Arch")
        else:
            back_arches.append("Excessive Arch")

    avg_elbow = sum(elbow_angles) / len(elbow_angles) if elbow_angles else 0
    lockout_pct = extensions.count("FULL LOCKOUT") / len(extensions) * 100 if extensions else 0
    neutral_pct = back_arches.count("Neutral") / len(back_arches) * 100 if back_arches else 0

    form_issues = []
    if lockout_pct < 30:
        form_issues.append("Incomplete lockout — fully extend arms at the top")
    if neutral_pct < 40:
        form_issues.append("Excessive back arch — maintain neutral spine")

    return {
        "rep_count": None,
        "avg_elbow_angle": round(avg_elbow, 1),
        "extension_status": "GOOD" if lockout_pct >= 30 else "INCOMPLETE",
        "back_arch_status": "NEUTRAL" if neutral_pct >= 40 else "EXCESSIVE",
        "form_issues": form_issues,
    }
