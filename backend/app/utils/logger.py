"""
ATHLETIX — Centralised Logging Setup
utils/logger.py

Usage:
    from app.utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("Processing video %s", video_id)

Uses Python stdlib logging — no extra packages needed at hackathon scale.
Log level is INFO in development, WARNING in production.


"""

import logging
import sys

from app.core.config import settings

_configured = False


def configure_logging() -> None:
    global _configured
    if _configured:
        return

    level = logging.INFO if settings.APP_ENV == "development" else logging.WARNING

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)
    _configured = True


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)
