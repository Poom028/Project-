from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import User
from app.schemas import UserResponse
from app.auth import get_current_active_user
from beanie import PydanticObjectId

router = APIRouter()

# Note: User registration is now handled by auth router
# This endpoint is kept for backward compatibility but should use auth/register instead

@router.get("/{id}", response_model=UserResponse)
async def get_user(id: str):
    user = await User.get(PydanticObjectId(id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=str(user.id), username=user.username, email=user.email)
