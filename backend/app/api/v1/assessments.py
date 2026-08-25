"""ATHLETIX — assessments routes (stub — to be implemented in later phases)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def placeholder():
    # TODO: implement assessments routes
    return {"success": True, "data": {"message": "assessments endpoint — coming in next phases"}}
