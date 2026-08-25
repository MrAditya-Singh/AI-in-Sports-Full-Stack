"""ATHLETIX — Auth routes (Phase 1)"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/signup")
async def signup():
    # TODO (Phase 1): Supabase Auth signup + role assignment
    return {"success": True, "data": {"message": "signup — Phase 1"}}


@router.post("/login")
async def login():
    # TODO (Phase 1): Supabase Auth login, return JWT
    return {"success": True, "data": {"message": "login — Phase 1"}}
