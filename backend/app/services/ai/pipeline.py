"""
ATHLETIX — AI Pipeline Orchestrator (Rewritten)
services/ai/pipeline.py

Analyses pre-recorded exercise videos using the ai-gym-coach detectors
(squat, pushup, biceps_curl, shoulder_press, lunges) plus the original
ATHLETIX extractors (bench_press, deadlift, pullup, handstand).

Flow:
  1. Fetch video metadata from Supabase
  2. Resolve video to a local file (download if remote)
  3. Run MediaPipe PoseLandmarker frame-by-frame (pose_estimation.py)
  4. Bridge keypoints → detector-compatible landmarks
  5. Run the ai-gym-coach detector .process() per frame
  6. Aggregate frame-level metrics → video-level summary
  7. Score via scoring.py
  8. Persist assessment to Supabase
  9. Notify athlete
"""

import math
import os
import tempfile
from collections.abc import Mapping
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

import httpx

from app.db.supabase_client import get_supabase_client
from app.services.ai.pose_estimation import extract_keypoints
from app.services.ai.scoring import compute_score
from app.utils.logger import get_logger

logger = get_logger("athletix.ai.pipeline")

MAX_DOWNLOAD_BYTES = 250 * 1024 * 1024
DOWNLOAD_CHUNK_SIZE = 1024 * 1024


# ─────────────────────────────────────────────────────────────────────────────
# Landmark bridge: dict → object with .x / .y / .visibility
# ─────────────────────────────────────────────────────────────────────────────

class LandmarkProxy:
    """
    Lightweight adapter that wraps a keypoint dict (from pose_estimation.py)
    into an object the ai-gym-coach detectors can call .x, .y, .visibility on.
    """

    __slots__ = ("x", "y", "z", "visibility")

    def __init__(self, d: dict[str, Any]) -> None:
        self.x: float = float(d.get("x", 0.0))
        self.y: float = float(d.get("y", 0.0))
        self.z: float = float(d.get("z", 0.0))
        self.visibility: float = float(d.get("visibility", 0.0))


def _to_landmark_proxies(frame_dicts: list[dict[str, Any]]) -> list[LandmarkProxy]:
    """Converts a frame of keypoint dicts into a list of LandmarkProxy objects."""
    return [LandmarkProxy(d) for d in frame_dicts]


# ─────────────────────────────────────────────────────────────────────────────
# Exercise registry
# ─────────────────────────────────────────────────────────────────────────────

# Exercises that use ai-gym-coach detectors (frame-by-frame .process())
_GYM_COACH_EXERCISES: set[str] = {
    "squat",
    "pushup",
    "biceps_curl",
    "shoulder_press",
    "lunges",
}

# Exercises that use original ATHLETIX extractors (batch extract_metrics)
_ATHLETIX_EXERCISES: set[str] = {
    "bench_press",
    "deadlift",
    "pullup",
    "handstand",
}

ALL_EXERCISES = _GYM_COACH_EXERCISES | _ATHLETIX_EXERCISES

EXERCISE_ALIASES: dict[str, str] = {
    "benchpress": "bench_press",
    "bench": "bench_press",
    "push_up": "pushup",
    "pushups": "pushup",
    "push_ups": "pushup",
    "pull_up": "pullup",
    "pullups": "pullup",
    "dead_lift": "deadlift",
    "hand_stand": "handstand",
    "squats": "squat",
    "bicep_curl": "biceps_curl",
    "bicep_curls": "biceps_curl",
    "biceps_curls": "biceps_curl",
    "lunge": "lunges",
    "shoulder_presses": "shoulder_press",
}


def _normalise_exercise(value: Any) -> str:
    """Validates and normalises an exercise name string."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Video exercise value is missing.")

    key = value.strip().lower().replace(" ", "_").replace("-", "_")
    key = EXERCISE_ALIASES.get(key, key)

    if key not in ALL_EXERCISES:
        raise ValueError(f"Unsupported exercise: {value}")

    return key


# ─────────────────────────────────────────────────────────────────────────────
# Gym-coach detector instantiation
# ─────────────────────────────────────────────────────────────────────────────

def _get_gym_coach_detector(exercise_key: str) -> Any:
    """Lazily imports and instantiates the matching ai-gym-coach detector."""
    from app.services.ai.exercises import ensure_gym_coach_path

    ensure_gym_coach_path()

    if exercise_key == "squat":
        from detectors.squat import SquatDetector  # type: ignore[import-not-found]
        return SquatDetector()
    elif exercise_key == "pushup":
        from detectors.pushup import PushUpDetector  # type: ignore[import-not-found]
        return PushUpDetector()
    elif exercise_key == "biceps_curl":
        from detectors.biceps_curl import BicepsCurlDetector  # type: ignore[import-not-found]
        return BicepsCurlDetector()
    elif exercise_key == "shoulder_press":
        from detectors.shoulder_press import ShoulderPressDetector  # type: ignore[import-not-found]
        return ShoulderPressDetector()
    elif exercise_key == "lunges":
        from detectors.lunges import LungesDetector  # type: ignore[import-not-found]
        return LungesDetector()
    else:
        raise ValueError(f"No gym-coach detector for: {exercise_key}")


# ─────────────────────────────────────────────────────────────────────────────
# Frame-level analysis using ai-gym-coach detectors
# ─────────────────────────────────────────────────────────────────────────────

def _analyse_with_gym_coach(
    exercise_key: str,
    keypoints_per_frame: list[list[dict[str, Any]]],
) -> dict[str, Any]:
    """
    Runs the ai-gym-coach detector .process() on each frame, then
    aggregates the per-frame results into a single video-level summary.
    """
    detector = _get_gym_coach_detector(exercise_key)
    detector.reset()

    frame_results: list[dict[str, Any]] = []

    for frame_dicts in keypoints_per_frame:
        if len(frame_dicts) < 33:
            continue

        landmarks = _to_landmark_proxies(frame_dicts)

        try:
            result = detector.process(landmarks)
        except Exception as exc:
            logger.debug("Detector frame error (%s): %s", exercise_key, exc)
            continue

        if isinstance(result, dict):
            frame_results.append(result)

    if not frame_results:
        raise ValueError(
            f"No valid frames were processed for '{exercise_key}'. "
            "Ensure the video shows a clear, full-body view."
        )

    # The final rep count comes from the detector's internal state
    rep_count = getattr(detector, "reps", 0)

    return _aggregate_frames(exercise_key, frame_results, rep_count)


def _aggregate_frames(
    exercise_key: str,
    frame_results: list[dict[str, Any]],
    rep_count: int,
) -> dict[str, Any]:
    """Aggregates per-frame detector results into a video-level summary."""
    n = len(frame_results)

    if exercise_key == "squat":
        knee_angles = [r.get("knee_angle", 0) for r in frame_results]
        back_angles = [r.get("back_angle", 0) for r in frame_results]
        depth_statuses = [r.get("depth_status", "N/A") for r in frame_results]

        avg_knee = sum(knee_angles) / n
        avg_back = sum(back_angles) / n
        good_depth_count = sum(
            1 for s in depth_statuses if s == "GOOD DEPTH"
        )
        good_depth_pct = (good_depth_count / n) * 100

        form_issues: list[str] = []
        if avg_back < 140:
            form_issues.append("Excessive forward lean — keep chest up")
        if good_depth_pct < 50:
            form_issues.append(
                "Insufficient squat depth — aim for parallel or below"
            )

        return {
            "rep_count": rep_count,
            "avg_knee_angle": round(avg_knee, 1),
            "avg_back_angle": round(avg_back, 1),
            "depth_status": "GOOD" if good_depth_pct >= 50 else "SHALLOW",
            "good_depth_pct": round(good_depth_pct, 1),
            "form_issues": form_issues,
        }

    elif exercise_key == "pushup":
        elbow_angles = [r.get("elbow_angle", 0) for r in frame_results]
        alignments = [r.get("body_alignment", "N/A") for r in frame_results]
        hip_statuses = [r.get("hip_status", "N/A") for r in frame_results]

        avg_elbow = sum(elbow_angles) / n
        straight_pct = (alignments.count("Straight") / n) * 100
        level_pct = (hip_statuses.count("LEVEL") / n) * 100

        form_issues = []
        if straight_pct < 50:
            form_issues.append(
                "Body alignment needs improvement — maintain plank position"
            )
        if level_pct < 50:
            form_issues.append(
                "Hip sagging detected — engage core muscles"
            )

        return {
            "rep_count": rep_count,
            "avg_elbow_angle": round(avg_elbow, 1),
            "body_alignment": "GOOD" if straight_pct >= 50 else "NEEDS WORK",
            "hip_status": "LEVEL" if level_pct >= 50 else "SAGGING",
            "straight_body_pct": round(straight_pct, 1),
            "form_issues": form_issues,
        }

    elif exercise_key == "biceps_curl":
        elbow_angles = [r.get("elbow_angle", 0) for r in frame_results]
        shoulder_statuses = [
            r.get("shoulder_status", "N/A") for r in frame_results
        ]
        swing_statuses = [
            r.get("swing_status", "N/A") for r in frame_results
        ]

        avg_elbow = sum(elbow_angles) / n
        stable_pct = (shoulder_statuses.count("STABLE") / n) * 100
        no_swing_pct = (swing_statuses.count("NO SWING") / n) * 100

        form_issues = []
        if stable_pct < 50:
            form_issues.append(
                "Elbow drifting from body — keep elbows pinned to sides"
            )
        if no_swing_pct < 50:
            form_issues.append(
                "Body swinging detected — use strict form, reduce weight"
            )

        return {
            "rep_count": rep_count,
            "avg_elbow_angle": round(avg_elbow, 1),
            "shoulder_status": "STABLE" if stable_pct >= 50 else "DRIFTING",
            "swing_status": "CONTROLLED" if no_swing_pct >= 50 else "SWINGING",
            "stable_pct": round(stable_pct, 1),
            "no_swing_pct": round(no_swing_pct, 1),
            "form_issues": form_issues,
        }

    elif exercise_key == "shoulder_press":
        elbow_angles = [r.get("elbow_angle", 0) for r in frame_results]
        extension_statuses = [
            r.get("extension_status", "N/A") for r in frame_results
        ]
        back_arch_statuses = [
            r.get("back_arch_status", "N/A") for r in frame_results
        ]

        avg_elbow = sum(elbow_angles) / n
        full_ext_pct = (
            extension_statuses.count("FULL EXTENSION") / n
        ) * 100
        neutral_pct = (back_arch_statuses.count("Neutral") / n) * 100

        form_issues = []
        if full_ext_pct < 30:
            form_issues.append(
                "Incomplete arm extension — press fully overhead"
            )
        if neutral_pct < 50:
            form_issues.append(
                "Excessive back arch — engage core, maintain neutral spine"
            )

        return {
            "rep_count": rep_count,
            "avg_elbow_angle": round(avg_elbow, 1),
            "extension_status": "GOOD" if full_ext_pct >= 30 else "INCOMPLETE",
            "back_arch_status": "NEUTRAL" if neutral_pct >= 50 else "ARCHED",
            "full_extension_pct": round(full_ext_pct, 1),
            "form_issues": form_issues,
        }

    elif exercise_key == "lunges":
        knee_angles = [r.get("front_knee_angle", 0) for r in frame_results]
        torso_angles = [r.get("torso_angle", 0) for r in frame_results]
        balance_statuses = [
            r.get("balance_status", "N/A") for r in frame_results
        ]

        avg_knee = sum(knee_angles) / n
        avg_torso = sum(torso_angles) / n
        balanced_pct = (balance_statuses.count("BALANCED") / n) * 100

        form_issues = []
        if avg_torso < 150:
            form_issues.append(
                "Torso leaning forward — keep chest upright"
            )
        if balanced_pct < 50:
            form_issues.append(
                "Balance issues detected — widen stance for stability"
            )

        return {
            "rep_count": rep_count,
            "avg_front_knee_angle": round(avg_knee, 1),
            "avg_torso_angle": round(avg_torso, 1),
            "balance_status": "BALANCED" if balanced_pct >= 50 else "UNSTABLE",
            "balanced_pct": round(balanced_pct, 1),
            "form_issues": form_issues,
        }

    # Fallback — should never reach here for gym-coach exercises
    raise ValueError(f"No aggregation logic for: {exercise_key}")


# ─────────────────────────────────────────────────────────────────────────────
# ATHLETIX-original batch extractors
# ─────────────────────────────────────────────────────────────────────────────

def _analyse_with_athletix_extractor(
    exercise_key: str,
    keypoints_per_frame: list[list[dict[str, Any]]],
) -> dict[str, Any]:
    """Runs the original ATHLETIX batch extract_metrics for legacy exercises."""
    from app.services.ai.exercises import bench_press as bench_press_mod
    from app.services.ai.exercises import deadlift as deadlift_mod
    from app.services.ai.exercises import pullup as pullup_mod
    from app.services.ai.exercises import handstand as handstand_mod

    ATHLETIX_EXTRACTORS: dict[str, Any] = {
        "bench_press": bench_press_mod,
        "deadlift": deadlift_mod,
        "pullup": pullup_mod,
        "handstand": handstand_mod,
    }

    extractor = ATHLETIX_EXTRACTORS.get(exercise_key)

    if extractor is None:
        raise ValueError(f"No extractor for: {exercise_key}")

    extract_fn = getattr(extractor, "extract_metrics", None)

    if not callable(extract_fn):
        raise TypeError(
            f"Extractor for '{exercise_key}' has no callable extract_metrics."
        )

    result = extract_fn(keypoints_per_frame)

    if result is None or not isinstance(result, Mapping):
        raise ValueError(
            f"'{exercise_key}' extractor returned invalid metrics."
        )

    return dict(result)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _has_items(value: Any) -> bool:
    """Works with lists and numpy arrays without ambiguous `if not array`."""
    if value is None:
        return False
    try:
        return len(value) > 0
    except TypeError:
        return False


def _validate_score_result(result: Any) -> dict[str, Any]:
    """Validates the scoring engine output."""
    if not isinstance(result, Mapping):
        raise TypeError("Scoring engine must return a dictionary/mapping.")

    required_fields = {"score", "strengths", "weaknesses", "suggestions"}
    missing_fields = required_fields.difference(result.keys())

    if missing_fields:
        raise ValueError(
            "Scoring result is missing fields: "
            + ", ".join(sorted(missing_fields))
        )

    try:
        score = float(result["score"])
    except (TypeError, ValueError) as exc:
        raise ValueError("Scoring result contains an invalid score.") from exc

    if not math.isfinite(score) or not 0 <= score <= 100:
        raise ValueError("Score must be between 0 and 100.")

    validated = dict(result)
    validated["score"] = round(score, 1)

    for field in ("strengths", "weaknesses", "suggestions"):
        value = validated.get(field)
        if value is None:
            validated[field] = []
        elif not isinstance(value, list):
            raise TypeError(f"Scoring field '{field}' must be a list.")

    return validated


# ─────────────────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────────────────

async def run_analysis_pipeline(video_id: str) -> None:
    """
    End-to-end AI analysis for a pre-recorded exercise video.

    Uses ai-gym-coach detectors for squat/pushup/biceps_curl/shoulder_press/
    lunges, and falls back to ATHLETIX extractors for bench_press/deadlift/
    pullup/handstand.
    """
    supabase = get_supabase_client()
    temporary_path: str | None = None
    should_delete_temporary_file = False

    logger.info("Pipeline started for video_id=%s", video_id)

    try:
        # ── Step 1: Fetch video record ───────────────────────────────────
        video_response = (
            supabase.table("videos")
            .select("*")
            .eq("id", video_id)
            .maybe_single()
            .execute()
        )

        video = video_response.data if video_response else None

        if not isinstance(video, Mapping):
            raise ValueError(f"Video {video_id} was not found.")

        athlete_id = video.get("athlete_id")
        video_url = video.get("video_url")
        exercise_key = _normalise_exercise(video.get("exercise"))

        if not athlete_id:
            raise ValueError("Video athlete_id is missing.")

        if not isinstance(video_url, str) or not video_url.strip():
            raise ValueError("Video URL/path is missing.")

        # ── Step 2: Mark as processing ───────────────────────────────────
        supabase.table("videos").update({
            "status": "processing",
            "error_msg": None,
        }).eq("id", video_id).execute()

        # ── Step 3: Resolve to local file ────────────────────────────────
        temporary_path, should_delete_temporary_file = (
            await _get_local_video_path(video_url)
        )

        video_path = Path(temporary_path)

        if not video_path.is_file():
            raise ValueError("Resolved video path is not a readable file.")

        if video_path.stat().st_size <= 0:
            raise ValueError("Video file is empty.")

        # ── Step 4: Extract pose keypoints ───────────────────────────────
        keypoints_per_frame = extract_keypoints(str(video_path))

        if not _has_items(keypoints_per_frame):
            raise ValueError(
                "No pose landmarks were detected in the video. "
                "Use a clear, well-lit full-body video."
            )

        # ── Step 5: Exercise-specific analysis ───────────────────────────
        if exercise_key in _GYM_COACH_EXERCISES:
            metrics = _analyse_with_gym_coach(
                exercise_key, keypoints_per_frame
            )
        else:
            metrics = _analyse_with_athletix_extractor(
                exercise_key, keypoints_per_frame
            )

        if not metrics:
            raise ValueError(
                f"'{exercise_key}' analysis returned empty metrics."
            )

        # ── Step 6: Score ────────────────────────────────────────────────
        score_result = compute_score(exercise_key, metrics)
        result = _validate_score_result(score_result)

        # ── Step 7: Upsert assessment ────────────────────────────────────
        assessment_payload = {
            "video_id": video_id,
            "score": result["score"],
            "strengths": result["strengths"],
            "weaknesses": result["weaknesses"],
            "suggestions": result["suggestions"],
            "rep_count": result.get("rep_count"),
        }

        existing_response = (
            supabase.table("assessments")
            .select("id")
            .eq("video_id", video_id)
            .maybe_single()
            .execute()
        )

        existing_data = (
            existing_response.data if existing_response else None
        )

        if (
            isinstance(existing_data, Mapping)
            and existing_data.get("id")
        ):
            assessment_response = (
                supabase.table("assessments")
                .update(assessment_payload)
                .eq("id", existing_data["id"])
                .execute()
            )
        else:
            assessment_response = (
                supabase.table("assessments")
                .insert(assessment_payload)
                .execute()
            )

        if not assessment_response or not assessment_response.data:
            raise RuntimeError("Assessment could not be saved.")

        # ── Step 8: Mark video completed ─────────────────────────────────
        status_response = (
            supabase.table("videos")
            .update({
                "status": "completed",
                "error_msg": None,
            })
            .eq("id", video_id)
            .execute()
        )

        if not status_response or not status_response.data:
            raise RuntimeError("Video could not be marked as completed.")

        # ── Step 9: Notify athlete ───────────────────────────────────────
        _notify_athlete(
            athlete_id=str(athlete_id),
            video_id=video_id,
            score=result["score"],
        )

        logger.info(
            "Pipeline completed for video_id=%s | score=%s",
            video_id,
            result["score"],
        )

    except Exception as exc:
        logger.exception(
            "Pipeline FAILED for video_id=%s: %s",
            video_id,
            exc,
        )
        _mark_video_failed(supabase, video_id, exc)

    finally:
        if should_delete_temporary_file and temporary_path:
            try:
                Path(temporary_path).unlink(missing_ok=True)
            except OSError as cleanup_error:
                logger.warning(
                    "Could not delete temporary video %s: %s",
                    temporary_path,
                    cleanup_error,
                )


# ─────────────────────────────────────────────────────────────────────────────
# Video resolution (local / file:// / http(s) download)
# ─────────────────────────────────────────────────────────────────────────────

async def _get_local_video_path(url: str) -> tuple[str, bool]:
    """
    Returns (resolved_path, is_temporary_download).

    Supports local paths, file:// URIs, and http(s) URLs.
    """
    if not isinstance(url, str) or not url.strip():
        raise ValueError("Video URL/path is empty.")

    url = url.strip()

    # Direct local path
    local_path = Path(url)
    if local_path.is_file():
        return str(local_path.resolve()), False

    # file:// URI
    if url.startswith("file://"):
        parsed = urlparse(url)
        file_path = Path(unquote(parsed.path))

        # Windows: /D:/folder/video.mp4 → D:/folder/video.mp4
        if os.name == "nt" and str(file_path).startswith("/"):
            file_path = Path(str(file_path)[1:])

        if file_path.is_file():
            return str(file_path.resolve()), False

        raise ValueError(f"Local video file does not exist: {file_path}")

    # Remote URL
    parsed_url = urlparse(url)
    if parsed_url.scheme not in {"http", "https"}:
        raise ValueError(f"Unable to resolve video path: {url}")

    allowed_suffixes = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
    suffix = Path(parsed_url.path).suffix.lower()
    if suffix not in allowed_suffixes:
        suffix = ".mp4"

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    )
    temp_path = temp_file.name
    temp_file.close()

    downloaded_bytes = 0

    try:
        timeout = httpx.Timeout(
            connect=20.0,
            read=120.0,
            write=30.0,
            pool=20.0,
        )

        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
        ) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()

                content_length = response.headers.get("content-length")
                if content_length:
                    try:
                        declared_size = int(content_length)
                    except ValueError:
                        declared_size = 0

                    if declared_size > MAX_DOWNLOAD_BYTES:
                        raise ValueError(
                            "Remote video exceeds the 250 MB limit."
                        )

                with open(temp_path, "wb") as destination:
                    async for chunk in response.aiter_bytes(
                        chunk_size=DOWNLOAD_CHUNK_SIZE
                    ):
                        if not chunk:
                            continue

                        downloaded_bytes += len(chunk)

                        if downloaded_bytes > MAX_DOWNLOAD_BYTES:
                            raise ValueError(
                                "Downloaded video exceeds the 250 MB limit."
                            )

                        destination.write(chunk)

        if downloaded_bytes <= 0:
            raise ValueError("Downloaded video is empty.")

        return temp_path, True

    except Exception:
        Path(temp_path).unlink(missing_ok=True)
        raise


# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────

def _mark_video_failed(
    supabase: Any,
    video_id: str,
    error: Exception,
) -> None:
    """Sets video status to 'failed' with a truncated error message."""
    message = str(error).strip() or error.__class__.__name__
    message = message[:500]

    try:
        supabase.table("videos").update({
            "status": "failed",
            "error_msg": message,
        }).eq("id", video_id).execute()

    except Exception as update_error:
        logger.error(
            "Could not mark video %s as failed: %s",
            video_id,
            update_error,
        )

        # Fallback if error_msg column has not been created yet
        try:
            supabase.table("videos").update({
                "status": "failed",
            }).eq("id", video_id).execute()
        except Exception:
            logger.exception(
                "Fallback video failure update also failed for %s",
                video_id,
            )


def _notify_athlete(
    athlete_id: str,
    video_id: str,
    score: float,
) -> None:
    """Inserts a notification for the athlete. Non-critical — never fails the pipeline."""
    try:
        supabase = get_supabase_client()

        supabase.table("notifications").insert({
            "user_id": athlete_id,
            "message": (
                "Your AI performance assessment is ready! "
                f"Score: {score}/100 🎯"
            ),
            "type": "report_ready",
        }).execute()

    except Exception as exc:
        logger.warning(
            "Could not insert notification for video %s: %s",
            video_id,
            exc,
        )