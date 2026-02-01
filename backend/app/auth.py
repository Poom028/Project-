"""
## Authentication & Authorization - ระบบยืนยันตัวตนและควบคุมสิทธิ์

ไฟล์นี้จัดการ:
1. การ hash และ verify password
2. การสร้างและ verify JWT tokens
3. การตรวจสอบสิทธิ์ผู้ใช้ (Authentication)
4. การตรวจสอบบทบาทผู้ใช้ (Authorization - Admin vs User)
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models import User

## ============================================
## JWT Configuration - ตั้งค่าสำหรับ JWT Token
## ============================================

## SECRET_KEY - คีย์ลับสำหรับ sign JWT tokens
## ⚠️ สำคัญ: ใน production ต้องเปลี่ยนเป็นคีย์ที่ปลอดภัยและเก็บเป็น secret
SECRET_KEY = "your-secret-key-change-this-in-production"

## ALGORITHM - อัลกอริทึมที่ใช้ในการ sign JWT
## HS256 เป็นอัลกอริทึมที่ใช้ shared secret key
ALGORITHM = "HS256"

## ACCESS_TOKEN_EXPIRE_MINUTES - ระยะเวลาที่ token ใช้ได้ (นาที)
## หลังจากเวลานี้ token จะหมดอายุและต้อง login ใหม่
ACCESS_TOKEN_EXPIRE_MINUTES = 30

## OAuth2 Scheme - ตั้งค่า OAuth2 สำหรับรับ token จาก request
## tokenUrl ระบุ endpoint ที่ใช้สำหรับ login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

## ============================================
## Password Functions - ฟังก์ชันจัดการรหัสผ่าน
## ============================================

## verify_password - ตรวจสอบว่ารหัสผ่านที่ผู้ใช้ใส่ถูกต้องหรือไม่
## เปรียบเทียบ plain password กับ hashed password ที่เก็บในฐานข้อมูล
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

## get_password_hash - hash รหัสผ่านก่อนเก็บในฐานข้อมูล
## ใช้ bcrypt เพื่อ hash password พร้อม salt อัตโนมัติ (ปลอดภัย)
def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Generate salt และ hash password
    # bcrypt จะสร้าง salt อัตโนมัติและผสมกับ password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

## ============================================
## JWT Token Functions - ฟังก์ชันจัดการ JWT Token
## ============================================

## create_access_token - สร้าง JWT token สำหรับ authentication
## ใช้เมื่อผู้ใช้ login สำเร็จ เพื่อให้ Frontend ใช้ token นี้ในการเรียก API
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()  # คัดลอกข้อมูลที่ต้องการใส่ใน token
    if expires_delta:
        expire = datetime.utcnow() + expires_delta  # ใช้เวลาที่กำหนด
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)  # ใช้ค่า default (15 นาที)
    to_encode.update({"exp": expire})  # เพิ่ม expiration time
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # สร้าง token
    return encoded_jwt

## ============================================
## Authentication Dependencies - ฟังก์ชันตรวจสอบสิทธิ์
## ============================================

## get_current_user - ตรวจสอบและดึงข้อมูลผู้ใช้จาก JWT token
## ใช้เป็น dependency ใน endpoints ที่ต้องการ authentication
## ถ้า token ไม่ถูกต้องหรือหมดอายุจะ throw HTTPException
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode JWT token เพื่อดึงข้อมูลที่เก็บไว้
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")  # ดึง username จาก token
        if username is None:
            raise credentials_exception
    except JWTError:
        # ถ้า token ไม่ถูกต้องหรือ decode ไม่ได้
        raise credentials_exception
    
    # ค้นหาผู้ใช้จาก username ในฐานข้อมูล
    user = await User.find_one(User.username == username)
    if user is None:
        # ถ้าไม่พบผู้ใช้
        raise credentials_exception
    return user

## get_current_active_user - ตรวจสอบว่าผู้ใช้ active อยู่หรือไม่
## ใช้เป็น dependency สำหรับ endpoints ที่ต้องการแค่ authentication
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    return current_user  # คืนค่า user ที่ authenticated แล้ว

## get_current_admin - ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
## ใช้เป็น dependency สำหรับ endpoints ที่ต้องการสิทธิ์ Admin เท่านั้น
## ถ้าไม่ใช่ Admin จะ throw HTTPException 403 Forbidden
async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Get current admin user - requires admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user
