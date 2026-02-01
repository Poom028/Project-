"""
## Models - ข้อมูลโครงสร้างของฐานข้อมูล

ไฟล์นี้กำหนดโครงสร้างข้อมูล (Data Models) สำหรับ MongoDB โดยใช้ Beanie ODM
แต่ละ Model จะถูกแปลงเป็น Collection ใน MongoDB
"""

from typing import Optional
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

## Book Model - โครงสร้างข้อมูลหนังสือ
## ใช้เก็บข้อมูลหนังสือทั้งหมดในระบบ
class Book(Document):
    title: str  # ชื่อหนังสือ
    author: str  # ชื่อผู้แต่ง
    isbn: Indexed(str, unique=True)  # ISBN (ไม่ซ้ำกัน, มี index เพื่อค้นหาอย่างรวดเร็ว)
    quantity: int = 0  # จำนวนหนังสือที่มี (ค่าเริ่มต้น = 0)
    image_url: Optional[str] = None  # URL รูปภาพหนังสือ (ไม่บังคับ)

    class Settings:
        name = "books"  # ชื่อ Collection ใน MongoDB

## User Model - โครงสร้างข้อมูลผู้ใช้
## ใช้เก็บข้อมูลผู้ใช้และ Admin ทั้งหมด
class User(Document):
    username: Indexed(str, unique=True)  # ชื่อผู้ใช้ (ไม่ซ้ำกัน, มี index)
    email: Indexed(str, unique=True)  # อีเมล (ไม่ซ้ำกัน, มี index)
    password: str  # รหัสผ่านที่ถูก hash แล้ว (ไม่เก็บรหัสผ่านแบบ plain text)
    role: str = "user"  # บทบาท: "user" (ผู้ใช้ทั่วไป) หรือ "admin" (ผู้ดูแลระบบ)
    created_at: datetime = Field(default_factory=datetime.utcnow)  # วันที่สร้างบัญชี (อัตโนมัติ)

    class Settings:
        name = "users"  # ชื่อ Collection ใน MongoDB

## Transaction Model - โครงสร้างข้อมูลการยืม-คืนหนังสือ
## ใช้เก็บประวัติการยืม-คืนหนังสือทั้งหมด
class Transaction(Document):
    user_id: str  # ID ของผู้ใช้ที่ยืม (เก็บเป็น string เพื่อความง่าย)
    book_id: str  # ID ของหนังสือที่ถูกยืม (เก็บเป็น string เพื่อความง่าย)
    borrow_date: datetime = Field(default_factory=datetime.utcnow)  # วันที่ยืม (อัตโนมัติ)
    return_date: Optional[datetime] = None  # วันที่คืน (เป็น NULL ถ้ายังไม่คืน)
    status: str = "Pending"  # สถานะ: "Pending" (รออนุมัติ), "Borrowed" (กำลังยืม), "PendingReturn" (รออนุมัติคืน), "Returned" (คืนแล้ว)

    class Settings:
        name = "transactions"  # ชื่อ Collection ใน MongoDB
