"""
ATHLETIX — FastAPI Backend Entry Point
main.py

Responsibilities:
  - Create the FastAPI app instance
  - Register all route groups (v1)
  - Mount global middleware (CORS, auth, exception handler)
  - Health-check endpoint (used by Phase 0 exit criteria)

Rules (from Rules.md):
  - No business logic here; only wiring
  - No AI/CV logic anywhere near this file
  - All secrets via config.py (never hardcoded)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1 import (
    auth,
    users,
    videos,
    assessments,
    leaderboard,
    verifications,
    shortlists,
    notifications,
    admin,
)

# ─── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("athletix")


# ─── Lifespan (startup / shutdown hooks) ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ATHLETIX backend starting up — env: %s", settings.APP_ENV)
    yield
    logger.info("ATHLETIX backend shutting down.")


# ─── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="ATHLETIX API",
    description="AI-Powered Sports Talent Assessment Platform — SIH 2026",
    version="1.0.0",
    lifespan=lifespan,
    # Disable docs in production later; fine for hackathon dev
    docs_url="/docs",
    redoc_url="/redoc",
)


# ─── CORS ─────────────────────────────────────────────────────────────────────
# Expo dev: any localhost origin during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global exception handlers ────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
            },
        },
    )


# Catches any unhandled exception and returns a safe, structured error response.
# NEVER leaks a raw Python stack trace to the client (Rules.md §9).
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again.",
            },
        },
    )


# ─── Route registration ───────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router,          prefix=f"{API_PREFIX}/auth",          tags=["Auth"])
app.include_router(users.router,         prefix=f"{API_PREFIX}/users",         tags=["Users"])
app.include_router(videos.router,        prefix=f"{API_PREFIX}/videos",        tags=["Videos"])
app.include_router(assessments.router,   prefix=f"{API_PREFIX}/assessments",   tags=["Assessments"])
app.include_router(leaderboard.router,   prefix=f"{API_PREFIX}/leaderboard",   tags=["Leaderboard"])
app.include_router(verifications.router, prefix=f"{API_PREFIX}/verifications", tags=["Verifications"])
app.include_router(shortlists.router,    prefix=f"{API_PREFIX}/shortlists",    tags=["Shortlists"])
app.include_router(notifications.router, prefix=f"{API_PREFIX}/notifications", tags=["Notifications"])
app.include_router(admin.router,         prefix=f"{API_PREFIX}/admin",         tags=["Admin"])


# ─── Health check ─────────────────────────────────────────────────────────────
# Phase 0 exit criteria: GET /health returns 200.
@app.get("/health", tags=["Health"])
async def health_check():
    return {"success": True, "data": {"status": "ok", "env": settings.APP_ENV}}
