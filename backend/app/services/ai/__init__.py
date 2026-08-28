"""
ATHLETIX — AI services package

This package contains all AI-related functionality:
- pipeline.py: Orchestrates pre-recorded video analysis
- pose_estimation.py: MediaPipe PoseLandmarker keypoint extraction
- scoring.py: Converts exercise metrics into performance scores
- exercises/: Exercise-specific metric extractors
  - Uses ai-gym-coach detectors for squat, pushup, biceps_curl,
    shoulder_press, lunges
  - Uses original ATHLETIX extractors for bench_press, deadlift,
    pullup, handstand
"""
