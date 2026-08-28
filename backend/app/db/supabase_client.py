"""
ATHLETIX — Supabase Client (singleton)
db/supabase_client.py

Creates a single Supabase client instance using the SERVICE_ROLE key.
The service role key bypasses RLS — this is intentional for server-side
operations. RLS is enforced separately by Supabase policies.

NEVER expose the service role key to the mobile client.

Working of this code:
- It creates a single Supabase client instance using the SERVICE_ROLE key.
- The service role key bypasses RLS — this is intentional for server-side
- operations. RLS is enforced separately by Supabase policies.
- NEVER expose the service role key to the mobile client.
"""

from functools import lru_cache

# pyrefly: ignore [missing-import]
from supabase import Client, create_client

from app.core.config import settings


def get_supabase_client() -> Client:
    """Returns a Supabase client configured with the service role key."""
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
    )

