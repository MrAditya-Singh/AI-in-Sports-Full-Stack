"""ATHLETIX — verifications routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement verifications routes
    return {"success": True, "data": {"message": "verifications endpoint — coming in next phases"}}
