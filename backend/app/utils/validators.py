"""
ATHLETIX — Video Upload Pre-validation
utils/validators.py

Validates uploaded video files BEFORE triggering the AI pipeline.
Rejecting early saves compute and returns a clear error to the athlete.

Rules (Rules.md §9):
  - Validate uploads before running AI — file type, duration, size cap
  - Return human-readable messages; never raw Python errors
"""

import logging
import os
import subprocess
import tempfile
from typing import BinaryIO

from fastapi import HTTPException, status

logger = logging.getLogger("athletix.validators")

ALLOWED_CONTENT_TYPES = {"video/mp4", "video/mpeg"}
MAX_FILE_SIZE_MB = 150           # generous cap for 1-2 min HD video
MIN_DURATION_SECONDS = 30        # 30 s minimum (allows shorter valid clips)
MAX_DURATION_SECONDS = 180       # 3 min hard cap (PRD: 1-2 min, small buffer)


def validate_video_file(
    filename: str,
    content_type: str,
    file_size_bytes: int,
) -> None:
    """
    Validates filename extension and content type.
    Raises HTTPException(400) on failure with a structured error body.
    """
    ext = os.path.splitext(filename)[-1].lower()
    if ext not in (".mp4",) or content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_FILE_TYPE",
                    "message": "Only MP4 video files are accepted. Please convert your video and try again.",
                },
            },
        )

    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "FILE_TOO_LARGE",
                    "message": f"Video file exceeds the {MAX_FILE_SIZE_MB}MB limit. Please trim or compress your video.",
                },
            },
        )
