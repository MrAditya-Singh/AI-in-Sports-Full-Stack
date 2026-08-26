"""
ATHLETIX — Pull-up Metric Extractor (Phase 5: FULLY IMPLEMENTED)
services/ai/exercises/pullup.py

Sport: Calisthenics
Adapted from BicepsCurlDetector pattern — elbow angle, shoulder stability, swing.
"""

import math
import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.pullup")

LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_HIP, RIGHT_HIP = 23, 24

UP_THRESHOLD = 50
DOWN_THRESHOLD = 160
MIN_VISIBILITY = 0.7
SWING_THRESHOLD = 15


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
        return {"rep_count": 0, "avg_elbow_angle": 0, "shoulder_status": "N/A",
                "swing_status": "N/A", "form_issues": []}

    reps = 0
    stage = None
    elbow_angles = []
    swing_statuses = []
    shoulder_statuses = []

    for landmarks in keypoints_per_frame:
        if len(landmarks) < 33:
            continue

        left_vis = landmarks[LEFT_ELBOW].get("visibility", 0)
        right_vis = landmarks[RIGHT_ELBOW].get("visibility", 0)

        if left_vis >= right_vis:
            s, e, w = LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST
        else:
            s, e, w = RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST

        elbow_angle = _angle(_pt(landmarks, s), _pt(landmarks, e), _pt(landmarks, w))

        key_visible = (landmarks[s].get("visibility", 0) > MIN_VISIBILITY and
                       landmarks[e].get("visibility", 0) > MIN_VISIBILITY)

        if key_visible:
            if elbow_angle < UP_THRESHOLD:
                stage = "up"
            if elbow_angle > DOWN_THRESHOLD and stage == "up":
                stage = "down"
                reps += 1

        elbow_angles.append(elbow_angle)

        elbow_drift = abs(landmarks[e]["x"] - landmarks[s]["x"])
        shoulder_statuses.append("STABLE" if elbow_drift <= 0.06 else "DRIFTING")

        shoulder_mid_x = (landmarks[LEFT_SHOULDER]["x"] + landmarks[RIGHT_SHOULDER]["x"]) / 2
        hip_mid_x = (landmarks[LEFT_HIP]["x"] + landmarks[RIGHT_HIP]["x"]) / 2
        shoulder_mid_y = (landmarks[LEFT_SHOULDER]["y"] + landmarks[RIGHT_SHOULDER]["y"]) / 2
        hip_mid_y = (landmarks[LEFT_HIP]["y"] + landmarks[RIGHT_HIP]["y"]) / 2
        dx = shoulder_mid_x - hip_mid_x
        dy = shoulder_mid_y - hip_mid_y
        torso_angle = math.degrees(math.atan2(abs(dx), abs(dy))) if dy != 0 else 0.0
        swing_statuses.append("NO SWING" if torso_angle <= SWING_THRESHOLD else "SWINGING")

    avg_elbow = sum(elbow_angles) / len(elbow_angles) if elbow_angles else 0
    stable_pct = shoulder_statuses.count("STABLE") / len(shoulder_statuses) * 100 if shoulder_statuses else 0
    no_swing_pct = swing_statuses.count("NO SWING") / len(swing_statuses) * 100 if swing_statuses else 0

    form_issues = []
    if no_swing_pct < 60:
        form_issues.append("Excessive body swing — use controlled movement")
    if stable_pct < 50:
        form_issues.append("Shoulder instability — keep shoulders engaged")

    return {
        "rep_count": reps,
        "avg_elbow_angle": round(avg_elbow, 1),
        "shoulder_status": "STABLE" if stable_pct >= 50 else "UNSTABLE",
        "swing_status": "CONTROLLED" if no_swing_pct >= 60 else "SWINGING",
        "form_issues": form_issues,
    }
