"""ATHLETIX — users routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement users routes
    return {"success": True, "data": {"message": "users endpoint — coming in next phases"}}
