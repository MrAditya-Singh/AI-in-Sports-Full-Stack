"""ATHLETIX — leaderboard routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement leaderboard routes
    return {"success": True, "data": {"message": "leaderboard endpoint — coming in next phases"}}
