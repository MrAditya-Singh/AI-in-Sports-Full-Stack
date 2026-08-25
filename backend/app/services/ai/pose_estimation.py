"""
ATHLETIX — MediaPipe BlazePose Wrapper
services/ai/pose_estimation.py

Extracts 33-keypoint coordinates per video frame using MediaPipe BlazePose.

Output format per frame:
    [
      { "landmark": 0, "x": 0.52, "y": 0.34, "z": -0.01, "visibility": 0.99 },
      ...  (33 landmarks total)
    ]

Rules (Rules.md §8):
  - This module is a data extractor only — no scoring logic here
  - Every placeholder is marked TODO; this stub returns empty data
    so the pipeline can be wired end-to-end before Phase 4 fills it in
"""

import logging
from typing import Any

logger = logging.getLogger("athletix.ai.pose_estimation")


def extract_keypoints(video_path: str) -> list[list[dict[str, Any]]]:
    """
    Runs MediaPipe BlazePose on every frame of the video at video_path.

    Args:
        video_path: Absolute path to a local MP4 file.

    Returns:
        List of frames; each frame is a list of 33 landmark dicts.
        Returns an empty list if no person is detected.

    Raises:
        ValueError: if the video file cannot be opened.
    """
    # TODO (Phase 4): Implement real BlazePose inference
    # Skeleton below shows the correct structure for Phase 4 to fill in.
    #
    # import cv2
    # import mediapipe as mp
    #
    # mp_pose = mp.solutions.pose
    # cap = cv2.VideoCapture(video_path)
    # if not cap.isOpened():
    #     raise ValueError(f"Cannot open video: {video_path}")
    #
    # frames: list[list[dict]] = []
    # with mp_pose.Pose(min_detection_confidence=0.5,
    #                   min_tracking_confidence=0.5) as pose:
    #     while True:
    #         ret, frame = cap.read()
    #         if not ret:
    #             break
    #         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    #         result = pose.process(rgb)
    #         if result.pose_landmarks:
    #             landmarks = [
    #                 {
    #                     "landmark": i,
    #                     "x": lm.x, "y": lm.y, "z": lm.z,
    #                     "visibility": lm.visibility,
    #                 }
    #                 for i, lm in enumerate(result.pose_landmarks.landmark)
    #             ]
    #             frames.append(landmarks)
    # cap.release()
    # return frames

    logger.warning("pose_estimation.extract_keypoints is a stub — returns empty frames (Phase 4 TODO)")
    return []  # TODO (Phase 4): replace with real BlazePose output
