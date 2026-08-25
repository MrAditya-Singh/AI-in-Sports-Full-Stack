"""
ATHLETIX — Pull-up Metric Extractor
services/ai/exercises/pullup.py

Sport: Calisthenics

Metrics extracted (Phase 4/5 TODO):
  chin_over_bar, elbow_extension_bottom, body_swing_penalty, rep_count

Rules (Rules.md §8):
  - Returns a dict; scoring.py uses the values
  - rep_count is returned for calisthenics, None for powerlifting
  - Every assumption about thresholds is documented here
"""

import logging
from typing import Any

logger = logging.getLogger("athletix.ai.exercises.pullup")


def extract_metrics(keypoints_per_frame: list[list[dict[str, Any]]]) -> dict[str, Any]:
    """
    Extracts Pull-up-specific performance metrics from BlazePose keypoints.

    Args:
        keypoints_per_frame: Output from pose_estimation.extract_keypoints()

    Returns:
        Dict of metric_name -> value (floats, ints, or lists)

    # TODO (Phase 4/5): Implement real metric extraction using joint angles
    # Key landmarks for this exercise: see MediaPipe landmark index reference
    #   https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
    """
    # TODO (Phase 4/5): Replace stub with real metric extraction
    logger.warning("pullup.extract_metrics is a stub (Phase 4/5 TODO)")

    return {
        # TODO: compute each metric from keypoints_per_frame
        "rep_count": None,   # set to int for calisthenics, leave None for powerlifting
    }
