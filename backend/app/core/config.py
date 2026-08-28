"""
ATHLETIX — Application Configuration
app/core/config.py
"""

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Application
    APP_ENV: str = "development"
    SECRET_KEY: str

    # Password-reset emails redirect here.
    FRONTEND_URL: str = "http://localhost:8081"

    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://athletix.vercel.app",
        "https://athletix.app",
        "https://athletix-sports.onrender.com",
    ]


settings = Settings()