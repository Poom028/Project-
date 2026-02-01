"""
## Schemas - โครงสร้างข้อมูลสำหรับ Request และ Response

ไฟล์นี้กำหนดโครงสร้างข้อมูลที่ใช้ในการรับส่งข้อมูลระหว่าง Frontend และ Backend
ใช้ Pydantic เพื่อ validate และ serialize ข้อมูลอัตโนมัติ
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

## ============================================
## Book Schemas - โครงสร้างข้อมูลหนังสือ
## ============================================

## BookBase - โครงสร้างพื้นฐานของหนังสือ
## ใช้เป็น base class สำหรับ schemas อื่นๆ
class BookBase(BaseModel):
    title: str  # ชื่อหนังสือ
    author: str  # ชื่อผู้แต่ง
    isbn: str  # ISBN
    quantity: int  # จำนวนหนังสือ
    image_url: Optional[str] = None  # URL รูปภาพ (ไม่บังคับ)

## BookCreate - โครงสร้างข้อมูลสำหรับสร้างหนังสือใหม่
## ใช้เมื่อ Admin สร้างหนังสือใหม่ (รับข้อมูลจาก Frontend)
class BookCreate(BookBase):
    pass  # ใช้โครงสร้างเดียวกับ BookBase

## BookUpdate - โครงสร้างข้อมูลสำหรับแก้ไขหนังสือ
## ใช้เมื่อ Admin แก้ไขข้อมูลหนังสือ (ทุก field เป็น optional)
class BookUpdate(BaseModel):
    title: Optional[str] = None  # ชื่อหนังสือ (ไม่บังคับ)
    author: Optional[str] = None  # ชื่อผู้แต่ง (ไม่บังคับ)
    quantity: Optional[int] = None  # จำนวนหนังสือ (ไม่บังคับ)
    image_url: Optional[str] = None  # URL รูปภาพ (ไม่บังคับ)

## BookResponse - โครงสร้างข้อมูลที่ส่งกลับไปยัง Frontend
## ใช้เมื่อ API ส่งข้อมูลหนังสือกลับไป (รวม ID ด้วย)
class BookResponse(BookBase):
    id: str  # ID ของหนังสือในฐานข้อมูล

## ============================================
## User Schemas - โครงสร้างข้อมูลผู้ใช้
## ============================================

## UserBase - โครงสร้างพื้นฐานของผู้ใช้
class UserBase(BaseModel):
    username: str  # ชื่อผู้ใช้
    email: str  # อีเมล

## UserCreate - โครงสร้างข้อมูลสำหรับสมัครสมาชิก
## ใช้เมื่อผู้ใช้สมัครสมาชิกใหม่ (รวม password และ role)
class UserCreate(UserBase):
    password: str  # รหัสผ่าน (จะถูก hash ก่อนเก็บในฐานข้อมูล)
    role: str = "user"  # บทบาท (ค่าเริ่มต้น = "user", สามารถเป็น "admin" ได้)

## UserLogin - โครงสร้างข้อมูลสำหรับเข้าสู่ระบบ
## ใช้เมื่อผู้ใช้ login (ส่ง username และ password)
class UserLogin(BaseModel):
    username: str  # ชื่อผู้ใช้
    password: str  # รหัสผ่าน

## UserResponse - โครงสร้างข้อมูลผู้ใช้ที่ส่งกลับไปยัง Frontend
## ใช้เมื่อ API ส่งข้อมูลผู้ใช้กลับไป (รวม ID, role, และ created_at)
class UserResponse(UserBase):
    id: str  # ID ของผู้ใช้ในฐานข้อมูล
    role: str  # บทบาท (user หรือ admin)
    created_at: datetime  # วันที่สร้างบัญชี

## Token - โครงสร้างข้อมูล JWT Token
## ใช้เมื่อ API ส่ง token กลับไปหลังจาก login สำเร็จ
class Token(BaseModel):
    access_token: str  # JWT token สำหรับ authentication
    token_type: str  # ประเภท token (มักจะเป็น "bearer")

## ============================================
## Transaction Schemas - โครงสร้างข้อมูลการยืม-คืน
## ============================================

## BorrowRequest - โครงสร้างข้อมูลสำหรับยืมหนังสือ
## ใช้เมื่อผู้ใช้ยืมหนังสือ (ส่ง user_id และ book_id)
class BorrowRequest(BaseModel):
    user_id: str  # ID ของผู้ใช้ที่ต้องการยืม
    book_id: str  # ID ของหนังสือที่ต้องการยืม

## ReturnRequest - โครงสร้างข้อมูลสำหรับคืนหนังสือ
## ใช้เมื่อผู้ใช้คืนหนังสือ (ส่ง user_id และ book_id)
class ReturnRequest(BaseModel):
    book_id: str  # ID ของหนังสือที่ต้องการคืน
    user_id: str  # ID ของผู้ใช้ที่ต้องการคืน

## TransactionResponse - โครงสร้างข้อมูลการยืม-คืนที่ส่งกลับไปยัง Frontend
## ใช้เมื่อ API ส่งข้อมูล transaction กลับไป (รวมทุกข้อมูลที่เกี่ยวข้อง)
class TransactionResponse(BaseModel):
    id: str  # ID ของ transaction ในฐานข้อมูล
    user_id: str  # ID ของผู้ใช้
    book_id: str  # ID ของหนังสือ
    borrow_date: datetime  # วันที่ยืม
    return_date: Optional[datetime] = None  # วันที่คืน (NULL ถ้ายังไม่คืน)
    status: str  # สถานะ: "Pending", "Borrowed", "PendingReturn", "Returned"
