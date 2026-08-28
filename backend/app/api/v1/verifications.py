"""
ATHLETIX — Verification Workflow Routes
api/v1/verifications.py

Athlete endpoints:
  POST /api/v1/verifications/requests
  GET  /api/v1/verifications/requests/mine
  GET  /api/v1/verifications/requests/{id}/documents

Admin endpoints:
  GET   /api/v1/verifications/requests
  PATCH /api/v1/verifications/requests/{id}/review

Existing official endpoints:
  POST   /api/v1/verifications/
  GET    /api/v1/verifications/mine
  DELETE /api/v1/verifications/{video_id}
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from app.core.security import (
    AuthenticatedUser,
    get_current_user,
    require_admin,
    require_athlete,
    require_official,
)

from app.db.supabase_client import get_supabase_client

from app.models.scouting import (
    VerificationReviewRequest,
    VerifyRequest,
)

logger = logging.getLogger("athletix.verifications")
router = APIRouter()

DOCUMENT_BUCKET = "verification-documents"
MAX_DOCUMENTS = 5
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024
SIGNED_URL_EXPIRY_SECONDS = 600

ALLOWED_DOCUMENT_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/x-png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/x-pdf": ".pdf",
    "application/acrobat": ".pdf",
}

ALLOWED_EXTENSIONS: dict[str, str] = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}



# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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


def _validate_uuid(
    value: str,
    field_name: str,
) -> str:
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, TypeError, AttributeError) as exc:
        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_ID",
            f"{field_name} is invalid.",
        ) from exc


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _notify_user(
    user_id: str,
    message: str,
    notification_type: str,
) -> None:
    """
    Notification failure does not roll back verification state.
    """
    try:
        supabase = get_supabase_client()

        supabase.table("notifications").insert({
            "user_id": user_id,
            "message": message,
            "type": notification_type,
        }).execute()

    except Exception as exc:
        logger.warning(
            "Could not create verification notification: %s",
            exc,
        )


def _remove_uploaded_documents(
    document_paths: list[str],
) -> None:
    if not document_paths:
        return

    try:
        supabase = get_supabase_client()

        supabase.storage.from_(
            DOCUMENT_BUCKET
        ).remove(document_paths)

    except Exception as exc:
        logger.warning(
            "Could not clean uploaded verification documents: %s",
            exc,
        )


def _extract_signed_url(
    signed_response: object,
) -> Optional[str]:
    if not isinstance(signed_response, dict):
        return None

    value = (
        signed_response.get("signedURL")
        or signed_response.get("signedUrl")
        or signed_response.get("signed_url")
    )

    return value if isinstance(value, str) else None


def _enrich_request_rows(
    supabase,
    raw_rows: object,
) -> list[dict]:
    """
    Adds athlete and video objects without relying on PostgREST embedded
    relationship names. This remains reliable even while PostgREST's schema
    cache is refreshing after foreign-key changes.
    """
    if not isinstance(raw_rows, list):
        return []

    rows = [dict(row) for row in raw_rows if isinstance(row, dict)]
    if not rows:
        return []

    athlete_ids = sorted({
        str(row["athlete_id"])
        for row in rows
        if row.get("athlete_id")
    })
    video_ids = sorted({
        str(row["video_id"])
        for row in rows
        if row.get("video_id")
    })

    athletes_by_id: dict[str, dict] = {}
    videos_by_id: dict[str, dict] = {}

    if athlete_ids:
        athlete_response = (
            supabase.table("users")
            .select("id,name,email")
            .in_("id", athlete_ids)
            .execute()
        )
        athletes_by_id = {
            str(item["id"]): item
            for item in (athlete_response.data or [])
            if isinstance(item, dict) and item.get("id")
        }

    if video_ids:
        video_response = (
            supabase.table("videos")
            .select(
                "id,sport,exercise,video_url,status,uploaded_at"
            )
            .in_("id", video_ids)
            .execute()
        )
        videos_by_id = {
            str(item["id"]): item
            for item in (video_response.data or [])
            if isinstance(item, dict) and item.get("id")
        }

    for row in rows:
        row["athlete"] = athletes_by_id.get(
            str(row.get("athlete_id")),
        )
        row["video"] = videos_by_id.get(
            str(row.get("video_id")),
        )

    return rows


# ---------------------------------------------------------------------------
# Athlete: create verification request
# ---------------------------------------------------------------------------

@router.post(
    "/requests",
    status_code=status.HTTP_201_CREATED,
)
async def create_verification_request(
    video_id: str = Form(...),
    details: str = Form(...),
    documents: list[UploadFile] = File(...),
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    """
    Creates a pending verification request for an athlete-owned,
    completed video.

    Required:
    - Completed video owned by authenticated athlete
    - Details between 10 and 2000 characters
    - 1 to 5 JPG, PNG, WebP or PDF documents
    """
    validated_video_id = _validate_uuid(
        video_id,
        "Video ID",
    )

    cleaned_details = details.strip()

    if not 10 <= len(cleaned_details) <= 2000:
        for document in documents:
            await document.close()

        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_DETAILS",
            "Details must contain between 10 and 2000 characters.",
        )

    if not 1 <= len(documents) <= MAX_DOCUMENTS:
        for document in documents:
            await document.close()

        raise _api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_DOCUMENT_COUNT",
            "Upload between 1 and 5 verification documents.",
        )

    supabase = get_supabase_client()

    # Confirm video belongs to authenticated athlete.
    try:
        video_response = (
            supabase.table("videos")
            .select(
                "id,athlete_id,sport,exercise,"
                "video_url,status"
            )
            .eq("id", validated_video_id)
            .eq("athlete_id", athlete.id)
            .maybe_single()
            .execute()
        )

        video = video_response.data

    except Exception as exc:
        logger.exception(
            "Could not load verification video: %s",
            exc,
        )

        for document in documents:
            await document.close()

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "VIDEO_FETCH_FAILED",
            "Could not validate the selected video.",
        ) from exc

    if not isinstance(video, dict):
        for document in documents:
            await document.close()

        raise _api_error(
            status.HTTP_404_NOT_FOUND,
            "VIDEO_NOT_FOUND",
            "Completed video was not found for this athlete.",
        )

    if video.get("status") not in ("completed", "pending"):
        for document in documents:
            await document.close()

        raise _api_error(
            status.HTTP_409_CONFLICT,
            "VIDEO_NOT_COMPLETED",
            "Only valid exercise attempts can be submitted for verification.",
        )

    # Prevent duplicate pending/approved request.
    try:
        duplicate_response = (
            supabase.table("verification_requests")
            .select("id,status")
            .eq("athlete_id", athlete.id)
            .eq("video_id", validated_video_id)
            .in_("status", ["pending", "approved"])
            .limit(1)
            .execute()
        )

        if duplicate_response.data:
            for document in documents:
                await document.close()

            duplicate_status = duplicate_response.data[0].get(
                "status",
                "pending",
            )

            raise _api_error(
                status.HTTP_409_CONFLICT,
                "REQUEST_ALREADY_EXISTS",
                (
                    "This video already has an active "
                    f"verification request with status '{duplicate_status}'."
                ),
            )

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Duplicate verification request check failed: %s",
            exc,
        )

        for document in documents:
            await document.close()

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "REQUEST_CHECK_FAILED",
            "Could not validate the verification request.",
        ) from exc

    request_id = str(uuid.uuid4())
    uploaded_paths: list[str] = []

    try:
        storage_bucket = supabase.storage.from_(
            DOCUMENT_BUCKET
        )

        for document in documents:
            content_type = (
                document.content_type
                or ""
            ).lower()

            extension = ALLOWED_DOCUMENT_TYPES.get(
                content_type
            )

            if extension is None and document.filename:
                import os
                _, file_ext = os.path.splitext(document.filename.lower())
                if file_ext in ALLOWED_EXTENSIONS:
                    extension = file_ext
                    content_type = ALLOWED_EXTENSIONS[file_ext]

            if extension is None:
                raise _api_error(
                    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    "INVALID_DOCUMENT_TYPE",
                    (
                        "Only JPG, PNG, WebP and PDF "
                        "documents are supported."
                    ),
                )


            content = await document.read(
                MAX_DOCUMENT_SIZE + 1
            )

            if not content:
                raise _api_error(
                    status.HTTP_400_BAD_REQUEST,
                    "EMPTY_DOCUMENT",
                    "An uploaded document is empty.",
                )

            if len(content) > MAX_DOCUMENT_SIZE:
                raise _api_error(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    "DOCUMENT_TOO_LARGE",
                    "Each document must not exceed 10 MB.",
                )

            object_path = (
                f"{athlete.id}/"
                f"{request_id}/"
                f"{uuid.uuid4().hex}{extension}"
            )

            storage_bucket.upload(
                object_path,
                content,
                file_options={
                    "content-type": content_type,
                    "upsert": "false",
                },
            )

            uploaded_paths.append(object_path)

        insert_response = (
            supabase.table("verification_requests")
            .insert({
                "id": request_id,
                "athlete_id": athlete.id,
                "video_id": validated_video_id,
                "exercise": video.get("exercise"),
                "details": cleaned_details,
                "document_paths": uploaded_paths,
                "status": "pending",
            })
            .execute()
        )

        if not insert_response.data:
            raise RuntimeError(
                "Verification request insert returned no data."
            )

        created_request = insert_response.data[0]

        _notify_user(
            athlete.id,
            (
                "Your verification request has been submitted "
                "and is waiting for admin review."
            ),
            "verification_pending",
        )

        return {
            "success": True,
            "data": {
                "message": (
                    "Verification request submitted successfully."
                ),
                "request": created_request,
            },
        }

    except HTTPException:
        _remove_uploaded_documents(uploaded_paths)
        raise

    except Exception as exc:
        logger.exception(
            "Verification request creation failed: %s",
            exc,
        )

        _remove_uploaded_documents(uploaded_paths)

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "REQUEST_CREATE_FAILED",
            "Could not create the verification request.",
        ) from exc

    finally:
        for document in documents:
            await document.close()


# ---------------------------------------------------------------------------
# Athlete: own request history/status
# ---------------------------------------------------------------------------

@router.get("/requests/mine")
async def get_my_verification_requests(
    athlete: AuthenticatedUser = Depends(require_athlete),
):
    """
    Returns verification requests belonging to the authenticated athlete.

    This endpoint intentionally uses a direct table query. The athlete
    history screen does not need embedded user/video relationships, and
    avoiding those extra lookups prevents a relationship/schema-cache
    failure from breaking the complete request history.
    """
    supabase = get_supabase_client()

    try:
        result = (
            supabase.table("verification_requests")
            .select(
                "id,"
                "athlete_id,"
                "video_id,"
                "exercise,"
                "details,"
                "document_paths,"
                "status,"
                "reviewed_by,"
                "review_note,"
                "created_at,"
                "updated_at,"
                "reviewed_at"
            )
            .eq("athlete_id", athlete.id)
            .order("created_at", desc=True)
            .execute()
        )

        rows = (
            result.data
            if isinstance(result.data, list)
            else []
        )

        return {
            "success": True,
            "data": rows,
            "meta": {
                "returned": len(rows),
            },
        }

    except Exception as exc:
        logger.exception(
            (
                "Could not fetch athlete verification requests "
                "for athlete_id=%s: %s"
            ),
            athlete.id,
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "REQUEST_FETCH_FAILED",
            "Could not fetch verification request history.",
        ) from exc


# ---------------------------------------------------------------------------
# Admin: list pending/all requests
# ---------------------------------------------------------------------------

@router.get("/requests")
async def get_verification_requests_for_admin(
    request_status: Optional[
        Literal["pending", "approved", "rejected"]
    ] = Query(
        default=None,
        alias="status",
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=200,
    ),
    admin: AuthenticatedUser = Depends(require_admin),
):
    del admin

    try:
        supabase = get_supabase_client()

        query = (
            supabase.table("verification_requests")
            .select("*")
        )

        if request_status:
            query = query.eq(
                "status",
                request_status,
            )

        result = (
            query
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )

        rows = _enrich_request_rows(
            supabase,
            result.data,
        )

        return {
            "success": True,
            "data": rows,
            "meta": {
                "status": request_status or "all",
                "returned": len(rows),
            },
        }

    except Exception as exc:
        logger.exception(
            "Admin verification request fetch failed: %s",
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "ADMIN_REQUEST_FETCH_FAILED",
            "Could not fetch verification requests.",
        ) from exc


# ---------------------------------------------------------------------------
# Athlete/Admin: signed document URLs
# ---------------------------------------------------------------------------

@router.get(
    "/requests/{request_id}/documents"
)
async def get_verification_request_documents(
    request_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    validated_request_id = _validate_uuid(
        request_id,
        "Request ID",
    )

    try:
        supabase = get_supabase_client()

        request_response = (
            supabase.table("verification_requests")
            .select("id,athlete_id,document_paths")
            .eq("id", validated_request_id)
            .maybe_single()
            .execute()
        )

        request_row = request_response.data

        if not isinstance(request_row, dict):
            raise _api_error(
                status.HTTP_404_NOT_FOUND,
                "REQUEST_NOT_FOUND",
                "Verification request was not found.",
            )

        is_owner = (
            user.role == "athlete"
            and str(request_row.get("athlete_id"))
            == str(user.id)
        )

        is_admin = user.role == "admin"

        if not is_owner and not is_admin:
            raise _api_error(
                status.HTTP_403_FORBIDDEN,
                "FORBIDDEN",
                "You cannot access these verification documents.",
            )

        document_paths = request_row.get(
            "document_paths"
        ) or []

        if not isinstance(document_paths, list):
            document_paths = []

        storage_bucket = supabase.storage.from_(
            DOCUMENT_BUCKET
        )

        documents = []

        for path in document_paths:
            if not isinstance(path, str):
                continue

            signed_response = (
                storage_bucket.create_signed_url(
                    path,
                    SIGNED_URL_EXPIRY_SECONDS,
                )
            )

            signed_url = _extract_signed_url(
                signed_response
            )

            if signed_url:
                documents.append({
                    "path": path,
                    "signed_url": signed_url,
                    "expires_in": (
                        SIGNED_URL_EXPIRY_SECONDS
                    ),
                })

        return {
            "success": True,
            "data": documents,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Signed document URL generation failed: %s",
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DOCUMENT_ACCESS_FAILED",
            "Could not access verification documents.",
        ) from exc


# ---------------------------------------------------------------------------
# Admin: approve/reject request
# ---------------------------------------------------------------------------

@router.patch(
    "/requests/{request_id}/review"
)
async def review_verification_request(
    request_id: str,
    body: VerificationReviewRequest,
    admin: AuthenticatedUser = Depends(require_admin),
):
    validated_request_id = _validate_uuid(
        request_id,
        "Request ID",
    )

    supabase = get_supabase_client()

    try:
        request_response = (
            supabase.table("verification_requests")
            .select("*")
            .eq("id", validated_request_id)
            .maybe_single()
            .execute()
        )

        request_row = request_response.data

        if not isinstance(request_row, dict):
            raise _api_error(
                status.HTTP_404_NOT_FOUND,
                "REQUEST_NOT_FOUND",
                "Verification request was not found.",
            )

        if request_row.get("status") != "pending":
            raise _api_error(
                status.HTTP_409_CONFLICT,
                "REQUEST_ALREADY_REVIEWED",
                "This verification request has already been reviewed.",
            )

        athlete_id = str(
            request_row.get("athlete_id")
        )
        video_id = str(
            request_row.get("video_id")
        )
        exercise = str(
            request_row.get("exercise")
        )

        reviewed_at = _now_iso()

        if body.status == "approved":
            # Idempotent final trust badge.
            verification_response = (
                supabase.table("verifications")
                .upsert(
                    {
                        "official_id": admin.id,
                        "athlete_id": athlete_id,
                        "video_id": video_id,
                        "exercise": exercise,
                    },
                    on_conflict=(
                        "official_id,video_id"
                    ),
                )
                .execute()
            )

            if not verification_response.data:
                raise RuntimeError(
                    "Approved verification badge was not created."
                )

        update_response = (
            supabase.table("verification_requests")
            .update({
                "status": body.status,
                "reviewed_by": admin.id,
                "review_note": body.review_note,
                "reviewed_at": reviewed_at,
                "updated_at": reviewed_at,
            })
            .eq("id", validated_request_id)
            .eq("status", "pending")
            .execute()
        )

        if not update_response.data:
            raise _api_error(
                status.HTTP_409_CONFLICT,
                "REQUEST_ALREADY_REVIEWED",
                "This request was reviewed by another admin.",
            )

        if body.status == "approved":
            message = (
                "Your verification request was approved. "
                "Your performance now has a verified badge!"
            )
            notification_type = "verification_approved"
        else:
            message = (
                "Your verification request was rejected. "
                f"Reason: {body.review_note}"
            )
            notification_type = "verification_rejected"

        _notify_user(
            athlete_id,
            message,
            notification_type,
        )

        return {
            "success": True,
            "data": {
                "message": (
                    "Verification request "
                    f"{body.status} successfully."
                ),
                "request": update_response.data[0],
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Admin verification review failed: %s",
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "REVIEW_FAILED",
            "Could not review the verification request.",
        ) from exc


# ---------------------------------------------------------------------------
# Existing official: direct performance verification
# ---------------------------------------------------------------------------

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
async def verify_athlete_video(
    body: VerifyRequest,
    official: AuthenticatedUser = Depends(require_official),
):
    athlete_id = _validate_uuid(
        body.athlete_id,
        "Athlete ID",
    )

    video_id = _validate_uuid(
        body.video_id,
        "Video ID",
    )

    supabase = get_supabase_client()

    try:
        video_response = (
            supabase.table("videos")
            .select("id,athlete_id,exercise,status")
            .eq("id", video_id)
            .eq("athlete_id", athlete_id)
            .maybe_single()
            .execute()
        )

        video = video_response.data

        if not isinstance(video, dict):
            raise _api_error(
                status.HTTP_404_NOT_FOUND,
                "VIDEO_NOT_FOUND",
                "Athlete video was not found.",
            )

        if video.get("status") != "completed":
            raise _api_error(
                status.HTTP_409_CONFLICT,
                "VIDEO_NOT_COMPLETED",
                "Only completed assessments can be verified.",
            )

        result = (
            supabase.table("verifications")
            .upsert(
                {
                    "official_id": official.id,
                    "athlete_id": athlete_id,
                    "video_id": video_id,
                    "exercise": video.get("exercise"),
                },
                on_conflict="official_id,video_id",
            )
            .execute()
        )

        _notify_user(
            athlete_id,
            (
                f"Official {official.email} verified your "
                f"{video.get('exercise')} performance!"
            ),
            "verified",
        )

        return {
            "success": True,
            "data": {
                "message": (
                    "Performance verified successfully."
                ),
                "verification": result.data,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Direct verification failed: %s",
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "VERIFY_FAILED",
            "Could not process verification.",
        ) from exc


@router.get("/mine")
async def get_my_verifications(
    user: AuthenticatedUser = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()

        column = (
            "official_id"
            if user.role == "official"
            else "athlete_id"
        )

        result = (
            supabase.table("verifications")
            .select("*")
            .eq(column, user.id)
            .order("verified_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "data": result.data or [],
        }

    except Exception as exc:
        logger.exception(
            "Verification fetch failed: %s",
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "FETCH_FAILED",
            "Could not fetch verifications.",
        ) from exc


@router.delete("/{video_id}")
async def revoke_verification(
    video_id: str,
    official: AuthenticatedUser = Depends(require_official),
):
    validated_video_id = _validate_uuid(
        video_id,
        "Video ID",
    )

    try:
        supabase = get_supabase_client()

        result = (
            supabase.table("verifications")
            .delete()
            .eq("official_id", official.id)
            .eq("video_id", validated_video_id)
            .execute()
        )

        return {
            "success": True,
            "data": {
                "message": "Verification revoked.",
                "deleted": result.data or [],
            },
        }

    except Exception as exc:
        logger.exception(
            "Verification revoke failed: %s",
            exc,
        )

        raise _api_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "REVOKE_FAILED",
            "Could not revoke verification.",
        ) from exc
