"""
ATHLETIX — Push-up Metric Extractor (Phase 5: FULLY IMPLEMENTED)
services/ai/exercises/pushup.py

Sport: Calisthenics
Ported from ai-gym-coach PushUpDetector.
"""

import math
import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.pushup")

LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_ANKLE, RIGHT_ANKLE = 27, 28

DOWN_THRESHOLD = 90
UP_THRESHOLD = 160
MIN_VISIBILITY = 0.7
HIP_SAG_TOLERANCE = 0.08


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
        return {"rep_count": 0, "avg_elbow_angle": 0, "body_alignment": "N/A",
                "hip_status": "N/A", "form_issues": []}

    reps = 0
    stage = None
    elbow_angles = []
    alignments = []
    hip_statuses = []

    for landmarks in keypoints_per_frame:
        if len(landmarks) < 33:
            continue

        left_vis = landmarks[LEFT_ELBOW].get("visibility", 0)
        right_vis = landmarks[RIGHT_ELBOW].get("visibility", 0)

        if left_vis >= right_vis:
            s, e, w, h, a = LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST, LEFT_HIP, LEFT_ANKLE
        else:
            s, e, w, h, a = RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST, RIGHT_HIP, RIGHT_ANKLE

        elbow_angle = _angle(_pt(landmarks, s), _pt(landmarks, e), _pt(landmarks, w))
        body_angle = _angle(_pt(landmarks, s), _pt(landmarks, h), _pt(landmarks, a))

        shoulder_y = landmarks[s]["y"]
        ankle_y = landmarks[a]["y"]
        hip_y = landmarks[h]["y"]
        expected_hip_y = (shoulder_y + ankle_y) / 2
        hip_deviation = hip_y - expected_hip_y

        key_visible = (landmarks[s].get("visibility", 0) > MIN_VISIBILITY and
                       landmarks[e].get("visibility", 0) > MIN_VISIBILITY and
                       landmarks[w].get("visibility", 0) > MIN_VISIBILITY)

        if key_visible:
            if elbow_angle < DOWN_THRESHOLD:
                stage = "down"
            if elbow_angle > UP_THRESHOLD and stage == "down":
                stage = "up"
                reps += 1

        elbow_angles.append(elbow_angle)

        if body_angle > 160:
            alignments.append("Straight")
        elif body_angle > 140:
            alignments.append("Slight Bend")
        else:
            alignments.append("Poor Form")

        if abs(hip_deviation) <= HIP_SAG_TOLERANCE:
            hip_statuses.append("LEVEL")
        elif hip_deviation > HIP_SAG_TOLERANCE:
            hip_statuses.append("SAGGING")
        else:
            hip_statuses.append("PIKED UP")

    avg_elbow = sum(elbow_angles) / len(elbow_angles) if elbow_angles else 0
    straight_pct = alignments.count("Straight") / len(alignments) * 100 if alignments else 0
    level_pct = hip_statuses.count("LEVEL") / len(hip_statuses) * 100 if hip_statuses else 0

    form_issues = []
    if straight_pct < 50:
        form_issues.append("Body alignment needs improvement — maintain plank position")
    if level_pct < 50:
        form_issues.append("Hip sagging detected — engage core muscles")

    return {
        "rep_count": reps,
        "avg_elbow_angle": round(avg_elbow, 1),
        "body_alignment": "GOOD" if straight_pct >= 50 else "NEEDS WORK",
        "hip_status": "LEVEL" if level_pct >= 50 else "SAGGING",
        "straight_body_pct": round(straight_pct, 1),
        "form_issues": form_issues,
    }
