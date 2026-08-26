"""
ATHLETIX — AI Pipeline Orchestrator (Phase 3/4/5: FULLY IMPLEMENTED)
services/ai/pipeline.py

Entry point for the full AI analysis pipeline.
Called as a FastAPI background task after a video is uploaded.

Pipeline steps:
  1. Fetch video metadata from DB
  2. Mark video status as 'processing'
  3. Validate exercise extractor routing
  4. Acquire video file (local upload storage or Cloudinary CDN)
  5. Run MediaPipe BlazePose keypoint extraction
  6. Extract exercise-specific metrics
  7. Compute score + feedback via scoring engine
  8. Write results to assessments table + mark video 'completed'
  9. Trigger in-app notification to athlete
"""

import logging
import tempfile
import os
import shutil
from typing import Any
from pathlib import Path

import httpx

from app.db.supabase_client import get_supabase_client
from app.services.ai.pose_estimation import extract_keypoints
from app.services.ai.scoring import compute_score
from app.utils.logger import get_logger

logger = get_logger("athletix.ai.pipeline")

# ─── Exercise router: maps exercise name → metric extractor module ─────────────
from app.services.ai.exercises import squat, bench_press, deadlift, pushup, pullup, handstand

EXERCISE_EXTRACTORS: dict[str, Any] = {
    "squat":       squat,
    "bench_press": bench_press,
    "deadlift":    deadlift,
    "pushup":      pushup,
    "pullup":      pullup,
    "handstand":   handstand,
}


async def run_analysis_pipeline(video_id: str) -> None:
    """
    Orchestrates the full AI analysis for a given video_id.
    Called as a background task — does NOT return a value to the caller.
    All results are persisted directly to the DB.
    """
    supabase = get_supabase_client()
    logger.info("Pipeline started for video_id=%s", video_id)
    tmp_path = None

    try:
        # ── Step 1: Fetch video metadata from DB ──────────────────────────────
        video_row = (
            supabase.table("videos")
            .select("*")
            .eq("id", video_id)
            .single()
            .execute()
        )
        if not video_row.data:
            raise ValueError(f"Video {video_id} not found in DB")

        video = video_row.data
        exercise_key = video["exercise"].lower().replace(" ", "_").replace("-", "_")

        # ── Step 2: Mark as processing ────────────────────────────────────────
        supabase.table("videos").update({"status": "processing"}).eq("id", video_id).execute()

        # ── Step 3: Validate exercise is supported ────────────────────────────
        if exercise_key not in EXERCISE_EXTRACTORS:
            # Fallback matching
            if "squat" in exercise_key:
                exercise_key = "squat"
            elif "push" in exercise_key:
                exercise_key = "pushup"
            elif "bench" in exercise_key or "press" in exercise_key:
                exercise_key = "bench_press"
            elif "dead" in exercise_key or "lunge" in exercise_key:
                exercise_key = "deadlift"
            elif "pull" in exercise_key or "curl" in exercise_key:
                exercise_key = "pullup"
            elif "hand" in exercise_key:
                exercise_key = "handstand"
            else:
                exercise_key = "squat"

        extractor = EXERCISE_EXTRACTORS[exercise_key]

        # ── Step 4: Get video local path ──────────────────────────────────────
        video_url = video["video_url"]
        tmp_path = await _get_local_video_path(video_url)

        # ── Step 5: Extract keypoints ──────────────────────────────────────────
        keypoints_per_frame = extract_keypoints(tmp_path)

        # ── Step 6: Extract exercise metrics ──────────────────────────────────
        metrics = extractor.extract_metrics(keypoints_per_frame)

        # ── Step 7: Score ─────────────────────────────────────────────────────
        result = compute_score(exercise_key, metrics)

        # ── Step 8: Write assessment to DB ────────────────────────────────────
        supabase.table("assessments").insert({
            "video_id":   video_id,
            "score":      result["score"],
            "strengths":  result["strengths"],
            "weaknesses": result["weaknesses"],
            "suggestions": result["suggestions"],
            "rep_count":  result.get("rep_count"),
        }).execute()

        supabase.table("videos").update({"status": "completed"}).eq("id", video_id).execute()

        # ── Step 9: Notify athlete ────────────────────────────────────────────
        _notify_athlete(video["athlete_id"], video_id, result["score"])

        logger.info("Pipeline completed for video_id=%s | score=%s", video_id, result["score"])

    except Exception as exc:
        logger.exception("Pipeline FAILED for video_id=%s: %s", video_id, exc)
        # Mark failed — never leave stuck at 'processing'
        try:
            supabase.table("videos").update({
                "status": "failed",
                "error_msg": str(exc)[:500],
            }).eq("id", video_id).execute()
        except Exception:
            pass

    finally:
        # Clean up temp file only if it was a downloaded copy
        try:
            if tmp_path and os.path.exists(tmp_path) and "temp" in tmp_path.lower():
                os.remove(tmp_path)
        except Exception:
            pass


async def _get_local_video_path(url: str) -> str:
    """Resolves URL to a local readable video file path."""
    # Check if URL is a local filesystem path
    if os.path.exists(url):
        return url

    # Remove file:// prefix if present
    clean_path = url.replace("file://", "")
    if os.path.exists(clean_path):
        return clean_path

    # If it's an HTTP/HTTPS URL (e.g. Cloudinary CDN)
    if url.startswith("http://") or url.startswith("https://"):
        suffix = ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name

        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                with open(tmp_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        f.write(chunk)
        return tmp_path

    raise ValueError(f"Unable to resolve video path: {url}")


def _notify_athlete(athlete_id: str, video_id: str, score: float) -> None:
    """Triggers an in-app notification for the athlete."""
    try:
        supabase = get_supabase_client()
        supabase.table("notifications").insert({
            "user_id": athlete_id,
            "message": f"Your AI performance assessment is ready! Score: {score}/100 🎯",
            "type":    "report_ready",
        }).execute()
    except Exception as e:
        logger.warning("Could not insert notification: %s", e)
