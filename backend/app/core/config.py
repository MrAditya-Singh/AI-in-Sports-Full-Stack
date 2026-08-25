"""
ATHLETIX — App Configuration
core/config.py

Loads all environment variables from .env using Pydantic BaseSettings.
No secret is ever hardcoded here — all values come from .env (Rules.md §5).

Usage anywhere in the app:
    from app.core.config import settings
    print(settings.SUPABASE_URL)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ignore unknown env vars silently
    )

    # ─── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # ─── Cloudinary ───────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # ─── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str
    ALLOWED_ORIGINS: list[str] = ["http://localhost:8081"]  # Expo default port


# Singleton — import this anywhere; do NOT create multiple instances
settings = Settings()
