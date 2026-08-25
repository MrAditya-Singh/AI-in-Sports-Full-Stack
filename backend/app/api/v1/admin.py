"""ATHLETIX — admin routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement admin routes
    return {"success": True, "data": {"message": "admin endpoint — coming in next phases"}}
