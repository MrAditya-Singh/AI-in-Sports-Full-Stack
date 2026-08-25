"""
ATHLETIX — AI Pipeline Orchestrator
services/ai/pipeline.py

Entry point for the full AI analysis pipeline.
Called as a FastAPI background task after a video is uploaded.

Pipeline steps:
  1. Download video from Cloudinary
  2. Pre-validate (frames, duration)
  3. Run pose estimation (MediaPipe BlazePose)
  4. Route to exercise-specific metric extractor
  5. Compute score + feedback via scoring engine
  6. Write results to assessments table + update video status
  7. Trigger push notification to athlete

Rules (Rules.md §7, §8):
  - AI logic is ISOLATED here — never inline in route handlers
  - Every failure path marks video status as 'failed' + logs reason
  - No fake-complete code — all TODOs are labelled
"""

import logging
import tempfile
import os
from typing import Any

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
        exercise_key = video["exercise"].lower().replace(" ", "_")

        # ── Step 2: Mark as processing ────────────────────────────────────────
        supabase.table("videos").update({"status": "processing"}).eq("id", video_id).execute()

        # ── Step 3: Validate exercise is supported ────────────────────────────
        if exercise_key not in EXERCISE_EXTRACTORS:
            raise ValueError(f"Unsupported exercise: {exercise_key}")

        extractor = EXERCISE_EXTRACTORS[exercise_key]

        # ── Step 4: Download video to temp file ───────────────────────────────
        # TODO (Phase 4): Download from Cloudinary URL
        video_url = video["video_url"]
        tmp_path = await _download_video(video_url)

        # ── Step 5: Extract keypoints ──────────────────────────────────────────
        # TODO (Phase 4): Implement pose_estimation.extract_keypoints
        keypoints_per_frame = extract_keypoints(tmp_path)

        # ── Step 6: Extract exercise metrics ──────────────────────────────────
        # TODO (Phase 4/5): Each extractor returns a metrics dict
        metrics = extractor.extract_metrics(keypoints_per_frame)

        # ── Step 7: Score ─────────────────────────────────────────────────────
        result = compute_score(exercise_key, metrics)
        # result = {score, strengths[], weaknesses[], suggestions[], rep_count}

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
        # TODO (Phase 7): trigger push notification
        _notify_athlete(video["athlete_id"], video_id)

        logger.info("Pipeline completed for video_id=%s | score=%s", video_id, result["score"])

    except Exception as exc:
        logger.exception("Pipeline FAILED for video_id=%s: %s", video_id, exc)
        # Mark failed — never leave stuck at 'processing' (Rules.md §9)
        supabase.table("videos").update({
            "status": "failed",
            "error_msg": str(exc)[:500],  # truncate for DB column
        }).eq("id", video_id).execute()

    finally:
        # Clean up temp file if it exists
        try:
            if "tmp_path" in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


async def _download_video(url: str) -> str:
    """Downloads video from URL to a temp file. Returns temp file path."""
    # TODO (Phase 4): Replace with Cloudinary authenticated download if needed
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


def _notify_athlete(athlete_id: str, video_id: str) -> None:
    """Triggers an in-app notification for the athlete."""
    # TODO (Phase 7): implement Expo push notification
    supabase = get_supabase_client()
    supabase.table("notifications").insert({
        "user_id": athlete_id,
        "message": "Your AI performance report is ready! 🎯",
        "type":    "report_ready",
    }).execute()
