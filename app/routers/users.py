from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models import User
from app.schemas import UserCreate, UserResponse
from beanie import PydanticObjectId

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate):
    existing_user = await User.find_one(User.username == user_in.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    user = User(**user_in.model_dump())
    await user.insert()
    return UserResponse(id=str(user.id), username=user.username, email=user.email)

@router.get("/{id}", response_model=UserResponse)
async def get_user(id: str):
    user = await User.get(PydanticObjectId(id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=str(user.id), username=user.username, email=user.email)
