"""ATHLETIX — shortlists routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement shortlists routes
    return {"success": True, "data": {"message": "shortlists endpoint — coming in next phases"}}
