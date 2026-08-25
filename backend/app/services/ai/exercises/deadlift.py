"""
ATHLETIX — Deadlift Metric Extractor
services/ai/exercises/deadlift.py

Sport: Powerlifting

Metrics extracted (Phase 4/5 TODO):
  hip_hinge_angle, spine_deviation, bar_path_proximity, lockout_quality

Rules (Rules.md §8):
  - Returns a dict; scoring.py uses the values
  - rep_count is returned for calisthenics, None for powerlifting
  - Every assumption about thresholds is documented here
"""

import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.deadlift")


def extract_metrics(keypoints_per_frame: list[list[dict[str, Any]]]) -> dict[str, Any]:
    """
    Extracts Deadlift-specific performance metrics from BlazePose keypoints.

    Args:
        keypoints_per_frame: Output from pose_estimation.extract_keypoints()

    Returns:
        Dict of metric_name -> value (floats, ints, or lists)

    # TODO (Phase 4/5): Implement real metric extraction using joint angles
    # Key landmarks for this exercise: see MediaPipe landmark index reference
    #   https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
    """
    # TODO (Phase 4/5): Replace stub with real metric extraction
    logger.warning("deadlift.extract_metrics is a stub (Phase 4/5 TODO)")

    return {
        # TODO: compute each metric from keypoints_per_frame
        "rep_count": None,   # set to int for calisthenics, leave None for powerlifting
    }
