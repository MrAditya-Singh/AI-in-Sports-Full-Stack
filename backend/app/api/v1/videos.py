"""
ATHLETIX — Video Upload & Lifecycle Management API
api/v1/endpoints/videos.py
"""

import logging
import os
import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from app.core.config import settings
from app.core.security import AuthenticatedUser, require_athlete
from app.db.supabase_client import get_supabase_client
from app.services.ai.pipeline import run_analysis_pipeline

logger = logging.getLogger("athletix.videos")
router = APIRouter()

# videos.py = backend/app/api/v1/videos.py → parents[3] = backend
BACKEND_ROOT = Path(__file__).resolve().parents[3]
UPLOAD_DIR = BACKEND_ROOT / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
MAX_UPLOAD_BYTES = 250 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024


def _api_error(
    status_code: int,
    code: str,
    message: str,
) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        },
    )


def _normalise_field(value: str, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_INPUT",
            f"{field_name.capitalize()} is required.",
        )

    normalised = (
        value.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )

    if not re.fullmatch(r"[a-z0-9_]{2,50}", normalised):
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_INPUT",
            f"{field_name.capitalize()} contains invalid characters.",
        )

    return normalised


async def _save_upload(
    file: UploadFile,
    destination: Path,
) -> int:
    """
    ✅ CHANGED:
    Streams upload in chunks instead of loading entire video into RAM.
    """
    total_bytes = 0

    try:
        with destination.open("wb") as output:
            while True:
                chunk = await file.read(UPLOAD_CHUNK_SIZE)

                if not chunk:
                    break

                total_bytes += len(chunk)

                if total_bytes > MAX_UPLOAD_BYTES:
                    raise _api_error(
                        status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        "FILE_TOO_LARGE",
                        "Video size must not exceed 250 MB.",
                    )

                output.write(chunk)

        if total_bytes <= 0:
            raise _api_error(
                status.HTTP_400_BAD_REQUEST,
                "EMPTY_FILE",
                "Uploaded video is empty.",
            )

        return total_bytes

    except Exception:
        destination.unlink(missing_ok=True)
        raise

    finally:
        await file.close()


def _remove_cloudinary_video(public_id: str | None) -> None:
    if not public_id:
        return

    try:
        import cloudinary.uploader

        cloudinary.uploader.destroy(
            public_id,
            resource_type="video",
            invalidate=True,
        )
    except Exception as exc:
        logger.warning(
            "Could not clean Cloudinary video %s: %s",
            public_id,
            exc,
        )


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sport: str = Form(...),
    exercise: str = Form(...),
    duration_seconds: Optional[float] = Form(None),
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    filename = file.filename or "attempt.mp4"
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        await file.close()
        raise _api_error(
            status.HTTP_400_BAD_REQUEST,
            "INVALID_FORMAT",
            "Only MP4, MOV, AVI, WEBM, or MKV videos are supported.",
        )

    try:
        sport_key = _normalise_field(sport, "sport")
        exercise_key = _normalise_field(exercise, "exercise")
    except HTTPException:
        await file.close()
        raise

    if duration_seconds is not None and (
        duration_seconds <= 0 or duration_seconds > 3600
    ):
        await file.close()
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_DURATION",
            "Video duration must be between 0 and 3600 seconds.",
        )

    unique_filename = (
        f"{athlete.id}_{uuid.uuid4().hex[:12]}{extension}"
    )
    local_path = UPLOAD_DIR / unique_filename

    try:
        await _save_upload(file, local_path)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to save uploaded video: %s", exc)
        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "FILE_SAVE_ERROR",
            "Could not save video file.",
        ) from exc

    final_video_url = str(local_path.resolve())
    cloudinary_public_id: str | None = None
    cloudinary_uploaded = False

    cloudinary_configured = all([
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    ])

    if cloudinary_configured:
        try:
            import cloudinary
            import cloudinary.uploader

            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )

            upload_response = cloudinary.uploader.upload_large(
                str(local_path),
                resource_type="video",
                folder="athletix_attempts",
                public_id=(
                    f"ath_{athlete.id}_"
                    f"{uuid.uuid4().hex[:12]}"
                ),
            )

            # ✅ CHANGED:
            # upload_large() returning None no longer causes res.get crash.
            if not isinstance(upload_response, dict):
                raise RuntimeError(
                    "Cloudinary returned an empty or invalid response."
                )

            secure_url = upload_response.get("secure_url")
            returned_public_id = upload_response.get("public_id")

            if not isinstance(secure_url, str) or not secure_url:
                raise RuntimeError(
                    "Cloudinary response does not contain secure_url."
                )

            if (
                not isinstance(returned_public_id, str)
                or not returned_public_id
            ):
                raise RuntimeError(
                    "Cloudinary response does not contain public_id."
                )

            final_video_url = secure_url
            cloudinary_public_id = returned_public_id
            cloudinary_uploaded = True

            logger.info(
                "Video uploaded to Cloudinary: %s",
                final_video_url,
            )

        except Exception as cloud_error:
            # Local upload remains usable.
            logger.warning(
                "Cloudinary upload failed; using local file: %s",
                cloud_error,
            )

            final_video_url = str(local_path.resolve())
            cloudinary_public_id = None
            cloudinary_uploaded = False

    supabase = get_supabase_client()

    try:
        video_insert = {
            "athlete_id": str(athlete.id),
            "sport": sport_key,
            "exercise": exercise_key,
            "video_url": final_video_url,
            "cloudinary_public_id": cloudinary_public_id,
            "duration_seconds": (
                float(duration_seconds)
                if duration_seconds is not None
                else 10.0
            ),
            "status": "pending",
            "error_msg": None,
        }

        insert_response = (
            supabase.table("videos")
            .insert(video_insert)
            .execute()
        )

        if not insert_response.data:
            raise RuntimeError(
                "Supabase video insert returned no data."
            )

        created_video = insert_response.data[0]

        if not isinstance(created_video, dict):
            raise RuntimeError(
                "Supabase returned an invalid video record."
            )

        video_id = created_video.get("id")

        if not video_id:
            raise RuntimeError(
                "Created video record does not contain an id."
            )

        background_tasks.add_task(
            run_analysis_pipeline,
            str(video_id),
        )

        # Cloudinary is now the permanent copy, so local duplicate can go.
        if cloudinary_uploaded:
            local_path.unlink(missing_ok=True)

        return {
            "success": True,
            "data": {
                "id": str(video_id),
                "status": "pending",
                "sport": sport_key,
                "exercise": exercise_key,
                "video_url": final_video_url,
                "message": (
                    "Video uploaded successfully. "
                    "AI analysis is processing in background! 🤖"
                ),
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Database video insert failed: %s", exc)

        local_path.unlink(missing_ok=True)

        if cloudinary_uploaded:
            _remove_cloudinary_video(cloudinary_public_id)

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DATABASE_ERROR",
            "Failed to create video record.",
        ) from exc


@router.get("")
async def get_my_videos(
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    supabase = get_supabase_client()

    try:
        response = (
            supabase.table("videos")
            .select("*, assessments(*)")
            .eq("athlete_id", str(athlete.id))
            .order("uploaded_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "data": response.data or [],
        }

    except Exception as exc:
        logger.exception("Get videos failed: %s", exc)
        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "FETCH_FAILED",
            "Could not retrieve video history.",
        ) from exc


@router.get("/{video_id}")
async def get_video_detail(
    video_id: str,
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    try:
        validated_video_id = str(uuid.UUID(video_id))
    except (ValueError, TypeError, AttributeError):
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_VIDEO_ID",
            "Video ID is invalid.",
        )

    supabase = get_supabase_client()

    try:
        response = (
            supabase.table("videos")
            .select("*, assessments(*)")
            .eq("id", validated_video_id)
            # ✅ CHANGED: Prevent athlete A reading athlete B's video.
            .eq("athlete_id", str(athlete.id))
            .maybe_single()
            .execute()
        )

        # pyrefly: ignore [missing-attribute]
        if not response.data:
            raise _api_error(
                status.HTTP_404_NOT_FOUND,
                "NOT_FOUND",
                "Video not found.",
            )

        return {
            "success": True,
            "data": response.data,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Get video detail failed: %s", exc)
        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "FETCH_FAILED",
            "Could not retrieve video.",
        ) from exc