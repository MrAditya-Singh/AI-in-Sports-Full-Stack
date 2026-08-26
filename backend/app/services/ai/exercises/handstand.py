"""
ATHLETIX — Handstand Metric Extractor (Phase 5: FULLY IMPLEMENTED)
services/ai/exercises/handstand.py

Sport: Calisthenics
Custom hold-duration detector — body alignment angle, vertical line.
"""

import math
import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.handstand")

LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_ANKLE, RIGHT_ANKLE = 27, 28

MIN_VISIBILITY = 0.6
ALIGNMENT_THRESHOLD = 165


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
        return {"rep_count": None, "avg_body_angle": 0, "alignment_status": "N/A",
                "hold_frames": 0, "form_issues": []}

    body_angles = []
    aligned_frames = 0
    total_valid = 0

    for landmarks in keypoints_per_frame:
        if len(landmarks) < 33:
            continue

        wrist_mid = ((landmarks[LEFT_WRIST]["x"] + landmarks[RIGHT_WRIST]["x"]) / 2,
                     (landmarks[LEFT_WRIST]["y"] + landmarks[RIGHT_WRIST]["y"]) / 2)
        shoulder_mid = ((landmarks[LEFT_SHOULDER]["x"] + landmarks[RIGHT_SHOULDER]["x"]) / 2,
                        (landmarks[LEFT_SHOULDER]["y"] + landmarks[RIGHT_SHOULDER]["y"]) / 2)
        hip_mid = ((landmarks[LEFT_HIP]["x"] + landmarks[RIGHT_HIP]["x"]) / 2,
                   (landmarks[LEFT_HIP]["y"] + landmarks[RIGHT_HIP]["y"]) / 2)
        ankle_mid = ((landmarks[LEFT_ANKLE]["x"] + landmarks[RIGHT_ANKLE]["x"]) / 2,
                     (landmarks[LEFT_ANKLE]["y"] + landmarks[RIGHT_ANKLE]["y"]) / 2)

        body_angle = _angle(wrist_mid, shoulder_mid, ankle_mid)
        body_angles.append(body_angle)

        key_visible = (landmarks[LEFT_WRIST].get("visibility", 0) >= MIN_VISIBILITY and
                       landmarks[LEFT_SHOULDER].get("visibility", 0) >= MIN_VISIBILITY)

        if key_visible:
            total_valid += 1
            if body_angle >= ALIGNMENT_THRESHOLD:
                aligned_frames += 1

    avg_angle = sum(body_angles) / len(body_angles) if body_angles else 0
    alignment_pct = aligned_frames / total_valid * 100 if total_valid > 0 else 0

    form_issues = []
    if avg_angle < 150:
        form_issues.append("Body line is too curved — aim for straight vertical alignment")
    if alignment_pct < 30:
        form_issues.append("Unstable hold — focus on core engagement and shoulder strength")

    return {
        "rep_count": None,
        "avg_body_angle": round(avg_angle, 1),
        "alignment_status": "ALIGNED" if alignment_pct >= 30 else "MISALIGNED",
        "hold_frames": aligned_frames,
        "alignment_pct": round(alignment_pct, 1),
        "form_issues": form_issues,
    }
