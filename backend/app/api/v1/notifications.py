"""ATHLETIX — notifications routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement notifications routes
    return {"success": True, "data": {"message": "notifications endpoint — coming in next phases"}}
