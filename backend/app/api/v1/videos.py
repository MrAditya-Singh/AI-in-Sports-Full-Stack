"""
ATHLETIX — Video Upload & Lifecycle Management API (Phase 3: FULLY IMPLEMENTED)
api/v1/videos.py

Endpoints:
  POST /api/v1/videos/upload   → Upload athlete attempt video & trigger AI analysis
  GET  /api/v1/videos          → List authenticated athlete's submitted videos
  GET  /api/v1/videos/{id}     → Get single video with status & assessment detail
"""

import os
import uuid
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, BackgroundTasks

from app.core.security import require_athlete, AuthenticatedUser
from app.core.config import settings
from app.db.supabase_client import get_supabase_client
from app.services.ai.pipeline import run_analysis_pipeline

logger = logging.getLogger("athletix.videos")
router = APIRouter()

# Local uploads directory for persistent storage
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# POST /videos/upload — Upload video and trigger AI analysis
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sport: str = Form(...),
    exercise: str = Form(...),
    duration_seconds: Optional[float] = Form(None),
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    """
    Accepts video file upload, stores locally (or uploads to Cloudinary if configured),
    creates a pending video record in Postgres, and kicks off the MediaPipe BlazePose
    AI pipeline as a background task.
    """
    # 1. Validate file extension
    filename = file.filename or "attempt.mp4"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".mp4", ".mov", ".avi", ".webm", ".mkv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "INVALID_FORMAT", "message": "Only MP4, MOV, AVI, WEBM, or MKV videos are supported."}},
        )

    # 2. Save file locally
    unique_filename = f"{athlete.id}_{uuid.uuid4().hex[:8]}{ext}"
    local_file_path = str(UPLOAD_DIR / unique_filename)

    try:
        with open(local_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as exc:
        logger.error("Failed to write local video file: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FILE_SAVE_ERROR", "message": "Could not save video file."}},
        )

    # 3. Optional Cloudinary upload (if configured)
    final_video_url = local_file_path
    public_id = unique_filename

    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )
            res = cloudinary.uploader.upload_large(
                local_file_path,
                resource_type="video",
                folder="athletix_attempts",
                public_id=f"ath_{athlete.id}_{uuid.uuid4().hex[:6]}",
            )
            final_video_url = res.get("secure_url", local_file_path)
            public_id = res.get("public_id", unique_filename)
            logger.info("Uploaded video to Cloudinary: %s", final_video_url)
        except Exception as cloud_exc:
            logger.warning("Cloudinary upload skipped/failed, using local storage: %s", cloud_exc)

    # 4. Insert record into Supabase `videos` table
    supabase = get_supabase_client()
    try:
        video_insert = {
            "athlete_id":        athlete.id,
            "sport":             sport.lower(),
            "exercise":          exercise.lower(),
            "video_url":         final_video_url,
            "cloudinary_public_id": public_id,
            "duration_seconds":  duration_seconds or 10.0,
            "status":            "pending",
        }
        res = supabase.table("videos").insert(video_insert).execute()
        if not res.data:
            raise ValueError("Insert video record returned no data")

        created_video = res.data[0]
        video_id = created_video["id"]

        # 5. Launch AI background analysis
        background_tasks.add_task(run_analysis_pipeline, video_id)

        logger.info("Video %s registered for athlete %s. AI task queued.", video_id, athlete.id)
        return {
            "success": True,
            "data": {
                "id":         video_id,
                "status":     "pending",
                "sport":      sport,
                "exercise":   exercise,
                "video_url":  final_video_url,
                "message":    "Video uploaded successfully. AI analysis is processing in background! 🤖",
            },
        }

    except Exception as exc:
        logger.error("DB insert video failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to create video record."}},
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /videos — List authenticated athlete's videos
# ─────────────────────────────────────────────────────────────────────────────
@router.get("")
async def get_my_videos(athlete: AuthenticatedUser = Depends(require_athlete)):
    """Fetches all submitted videos by the authenticated athlete."""
    supabase = get_supabase_client()
    try:
        res = (
            supabase.table("videos")
            .select("*, assessments(*)")
            .eq("athlete_id", athlete.id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        return {"success": True, "data": res.data or []}
    except Exception as exc:
        logger.error("Get videos failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not retrieve video history."}},
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /videos/{video_id} — Single video detail + assessment
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{video_id}")
async def get_video_detail(
    video_id: str,
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    """Fetches single video detail by ID with linked assessment report."""
    supabase = get_supabase_client()
    try:
        res = (
            supabase.table("videos")
            .select("*, assessments(*)")
            .eq("id", video_id)
            .maybe_single()
            .execute()
        )
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Video not found."}},
            )
        return {"success": True, "data": res.data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Get video detail failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": {"code": "FETCH_FAILED", "message": "Could not retrieve video."}},
        )
