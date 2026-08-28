"""
ATHLETIX — Exercise Extractors Package
services/ai/exercises/__init__.py

Provides sys.path injection for ai-gym-coach detectors.
The original ATHLETIX batch extractors (bench_press, deadlift, pullup,
handstand) live as sibling modules and are imported directly by pipeline.py.
"""

import sys
from pathlib import Path

# Path to the ai-gym-coach Main App directory
# exercises/__init__.py = backend/app/services/ai/exercises/__init__.py
# parents[5] = project root (AI in Sports-Full Stack)
_GYM_COACH_APP_DIR = (
    Path(__file__).resolve().parents[5]
    / "ai-gym-coach-main - Copy"
    / "Main App"
)

_path_injected = False


def ensure_gym_coach_path() -> None:
    """
    Adds the ai-gym-coach 'Main App' directory to sys.path so that
    `from detectors.squat import SquatDetector` etc. resolve correctly.

    Safe to call multiple times — only injects once.
    """
    global _path_injected

    if _path_injected:
        return

    app_dir = str(_GYM_COACH_APP_DIR)

    if not _GYM_COACH_APP_DIR.is_dir():
        raise FileNotFoundError(
            f"ai-gym-coach Main App directory not found at: {app_dir}"
        )

    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)

    _path_injected = True
