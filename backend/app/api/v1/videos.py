"""ATHLETIX — videos routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement videos routes
    return {"success": True, "data": {"message": "videos endpoint — coming in next phases"}}
