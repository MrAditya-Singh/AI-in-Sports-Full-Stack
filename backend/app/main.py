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

from fastapi import FastAPI, HTTPException, Request
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
    live_coach,
    push_tokens,
)

# ─── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("athletix")


def start_streamlit_coach_background():
    try:
        import socket, subprocess, sys
        from pathlib import Path

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        res = sock.connect_ex(('127.0.0.1', 8501))
        sock.close()
        if res == 0:
            logger.info("AI Gym Coach Engine is already active on port 8501.")
            return

        # Find workspace root directory containing "ai-gym-coach-main - Copy"
        backend_dir = Path(__file__).resolve().parent.parent
        workspace_dir = backend_dir.parent
        coach_script = workspace_dir / "ai-gym-coach-main - Copy" / "Main App" / "main.py"

        if not coach_script.exists():
            # Fallback check inside backend_dir
            coach_script = backend_dir / "ai-gym-coach-main - Copy" / "Main App" / "main.py"

        if coach_script.exists():
            logger.info("Activating AI Gym Coach Engine on port 8501 (%s)...", coach_script)
            subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "streamlit",
                    "run",
                    str(coach_script),
                    "--server.port",
                    "8501",
                    "--server.address",
                    "0.0.0.0",
                    "--server.headless",
                    "true",
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                cwd=str(coach_script.parent.parent),
            )
            logger.info("AI Gym Coach Engine launched successfully in background!")
        else:
            logger.warning("Could not find AI Gym Coach script at %s", coach_script)
    except Exception as exc:
        logger.error("Could not auto-activate AI Gym Coach Engine: %s", exc)


# ─── Lifespan (startup / shutdown hooks) ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ATHLETIX backend starting up — env: %s", settings.APP_ENV)
    start_streamlit_coach_background()
    yield
    logger.info("ATHLETIX backend shutting down.")


# ─── App instance ─────────────────────────────────────────────────────────────
is_dev_env = settings.APP_ENV.lower() == "development"

app = FastAPI(
    title="ATHLETIX API",
    description="AI-Powered Sports Talent Assessment Platform — SIH 2026",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allow web app (Vercel, localhost) and mobile devices to access API seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://mobile-app-theta-gules.vercel.app",
        "https://athletix.vercel.app",
        "https://athletix.app",
    ],
    allow_origin_regex=r"^https?://.*",
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
app.include_router(live_coach.router,    prefix=f"{API_PREFIX}/live",          tags=["Live Coach"])
app.include_router(push_tokens.router,   prefix=f"{API_PREFIX}/push-tokens",   tags=["Push Tokens"])


# ─── Health check ─────────────────────────────────────────────────────────────
# Phase 0 exit criteria: GET /health returns 200.
@app.get("/health", tags=["Health"])
async def health_check():
    return {"success": True, "data": {"status": "ok", "env": settings.APP_ENV}}
