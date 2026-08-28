"""
ATHLETIX — MediaPipe BlazePose Tasks API Wrapper (Phase 4: FULLY IMPLEMENTED)
services/ai/pose_estimation.py

Uses MediaPipe Tasks Python API (PoseLandmarker) with pose_landmarker_full.task
model for robust 33-keypoint tracking across video frames.

Working of this code::
- It uses MediaPipe Tasks Python API (PoseLandmarker) with pose_landmarker_full.task
- model for robust 33-keypoint tracking across video frames.
"""

import logging
import os
from pathlib import Path
from typing import Any

# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import mediapipe as mp
# pyrefly: ignore [missing-import]
from mediapipe.tasks import python
# pyrefly: ignore [missing-import]
from mediapipe.tasks.python import vision

logger = logging.getLogger("athletix.ai.pose_estimation")

MODEL_PATH = Path(__file__).resolve().parent / "ml_models" / "pose_landmarker_full.task"


def get_pose_landmarker() -> vision.PoseLandmarker:
    """Initializes and returns the MediaPipe PoseLandmarker instance."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Pose model asset not found at {MODEL_PATH}")

    base_options = python.BaseOptions(model_asset_path=str(MODEL_PATH))
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_segmentation_masks=False,
    )
    return vision.PoseLandmarker.create_from_options(options)


def extract_keypoints(video_path: str) -> list[list[dict[str, Any]]]:
    """
    Runs MediaPipe PoseLandmarker on every frame of the video at video_path.

    Args:
        video_path: Absolute path to a local video file.

    Returns:
        List of frames; each frame is a list of 33 landmark dicts with keys:
        'landmark', 'x', 'y', 'z', 'visibility'.
    """
    if not os.path.exists(video_path):
        raise ValueError(f"Video file not found: {video_path}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    landmarker = get_pose_landmarker()
    frames: list[list[dict[str, Any]]] = []
    frame_timestamp_ms = 0
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval_ms = int(1000.0 / fps)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

            # Process frame with running timestamp
            result = landmarker.detect_for_video(mp_image, frame_timestamp_ms)
            frame_timestamp_ms += frame_interval_ms

            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                landmarks = [
                    {
                        "landmark": i,
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z,
                        "visibility": getattr(lm, "visibility", 1.0) or 1.0,
                    }
                    for i, lm in enumerate(result.pose_landmarks[0])
                ]
                frames.append(landmarks)
    finally:
        cap.release()
        try:
            landmarker.close()
        except Exception:
            pass

    logger.info("BlazePose processed %d frames with landmarks in %s", len(frames), video_path)
    return frames
