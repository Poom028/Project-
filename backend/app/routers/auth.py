"""
## Authentication Router - API Endpoints สำหรับการยืนยันตัวตน

ไฟล์นี้จัดการ API endpoints ที่เกี่ยวข้องกับการสมัครสมาชิกและเข้าสู่ระบบ:
- POST /auth/register - สมัครสมาชิก
- POST /auth/login - เข้าสู่ระบบ (OAuth2 form)
- POST /auth/login-json - เข้าสู่ระบบ (JSON body - สำหรับ Frontend)
- GET /auth/me - ดึงข้อมูลผู้ใช้ปัจจุบัน
"""

from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.models import User
from app.schemas import UserCreate, UserResponse, Token, UserLogin
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)

## สร้าง Router สำหรับ authentication endpoints
router = APIRouter()

## POST /auth/register - สมัครสมาชิก
## Public endpoint - ไม่ต้อง login ก็สมัครได้
## ใช้เมื่อผู้ใช้ใหม่ต้องการสร้างบัญชีในระบบ
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user or admin"""
    # ตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่ (username ต้องไม่ซ้ำกัน)
    existing_user = await User.find_one(User.username == user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # ตรวจสอบว่าอีเมลซ้ำหรือไม่ (email ต้องไม่ซ้ำกัน)
    existing_email = await User.find_one(User.email == user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # กำหนดบทบาท (role) ของผู้ใช้
    # ถ้า username = "admin" และ password = "admin123" จะเป็น admin
    # ถ้าไม่ใช่จะใช้ role จาก request หรือ default เป็น "user"
    user_role = "user"
    if user_data.username.lower() == "admin" and user_data.password == "admin123":
        user_role = "admin"
    elif hasattr(user_data, 'role') and user_data.role:
        user_role = user_data.role
    
    # Hash password ก่อนเก็บในฐานข้อมูล (เพื่อความปลอดภัย)
    hashed_password = get_password_hash(user_data.password)
    
    # สร้าง User object และบันทึกลงฐานข้อมูล
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=hashed_password,
        role=user_role
    )
    await user.insert()
    
    # ส่งข้อมูลผู้ใช้ที่สร้างแล้วกลับไป (ไม่ส่ง password)
    return UserResponse(
        id=str(user.id), 
        username=user.username, 
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

## POST /auth/login - เข้าสู่ระบบ (OAuth2 Form)
## Public endpoint - ใช้สำหรับ OAuth2 standard form
## รับข้อมูลเป็น form-data (username, password)
@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token"""
    # ค้นหาผู้ใช้จาก username
    user = await User.find_one(User.username == form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ตรวจสอบรหัสผ่าน (เปรียบเทียบกับ hashed password ในฐานข้อมูล)
    if not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # สร้าง JWT token พร้อมข้อมูล username และ role
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # ส่ง token กลับไป (Frontend จะใช้ token นี้ในการเรียก API อื่นๆ)
    return {"access_token": access_token, "token_type": "bearer"}

## POST /auth/login-json - เข้าสู่ระบบ (JSON Body)
## Public endpoint - ใช้สำหรับ Frontend (React Native)
## รับข้อมูลเป็น JSON body (username, password)
## ใช้ endpoint นี้แทน /auth/login เพราะ Frontend ใช้ JSON
@router.post("/login-json", response_model=Token)
async def login_json(login_data: UserLogin):
    """Login with JSON body (for frontend compatibility)"""
    # ค้นหาผู้ใช้จาก username
    user = await User.find_one(User.username == login_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ตรวจสอบรหัสผ่าน
    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # สร้าง JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # ส่ง token กลับไป
    return {"access_token": access_token, "token_type": "bearer"}

## GET /auth/me - ดึงข้อมูลผู้ใช้ปัจจุบัน
## Protected endpoint - ต้อง login และส่ง token
## ใช้สำหรับ Frontend เพื่อดึงข้อมูลผู้ใช้ที่ login อยู่
@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    # ส่งข้อมูลผู้ใช้ปัจจุบันกลับไป (ไม่ส่ง password)
    return UserResponse(
        id=str(current_user.id), 
        username=current_user.username, 
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at
    )
