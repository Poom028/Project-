"""
## Main Application - จุดเริ่มต้นของ FastAPI Application

ไฟล์นี้เป็นไฟล์หลักที่สร้าง FastAPI application และตั้งค่าต่างๆ
รวมถึงการเชื่อมต่อฐานข้อมูล, CORS, และการรวม routers ทั้งหมด
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import books, users, transactions, auth

## สร้าง FastAPI Application Instance
## app คือ object หลักที่ใช้จัดการ API endpoints ทั้งหมด
app = FastAPI()

## CORS Configuration - ตั้งค่าการอนุญาตให้ Frontend เชื่อมต่อ
## CORS (Cross-Origin Resource Sharing) จำเป็นสำหรับให้ Frontend (React Native) 
## สามารถเรียก API จาก domain/port อื่นได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # อนุญาตทุก origin (ใน production ควรระบุเฉพาะ origin ที่ต้องการ)
    allow_credentials=True,  # อนุญาตให้ส่ง credentials (cookies, headers)
    allow_methods=["*"],  # อนุญาตทุก HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # อนุญาตทุก headers
)

## Startup Event - ฟังก์ชันที่รันเมื่อแอปพลิเคชันเริ่มทำงาน
## ใช้สำหรับเชื่อมต่อฐานข้อมูล MongoDB ก่อนที่ API จะพร้อมใช้งาน
@app.on_event("startup")
async def start_db():
    await init_db()  # เรียกฟังก์ชันเชื่อมต่อฐานข้อมูล

## รวม Routers - เพิ่ม API endpoints จากไฟล์ routers ต่างๆ
## แต่ละ router จะมี endpoints ของตัวเอง เช่น /auth/login, /books/, etc.

## Authentication Router - จัดการการเข้าสู่ระบบและสมัครสมาชิก
## Endpoints: /auth/register, /auth/login, /auth/me
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

## Books Router - จัดการข้อมูลหนังสือ
## Endpoints: /books/ (GET, POST), /books/{id} (GET, PUT, DELETE)
app.include_router(books.router, prefix="/books", tags=["Books"])

## Users Router - จัดการข้อมูลผู้ใช้
## Endpoints: /users/ (POST), /users/{id} (GET)
app.include_router(users.router, prefix="/users", tags=["Users"])

## Transactions Router - จัดการการยืม-คืนหนังสือ
## Endpoints: /transactions/borrow, /transactions/return, /transactions/user/{user_id}
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])

## Admin Router - จัดการฟีเจอร์สำหรับ Admin เท่านั้น
## Endpoints: /admin/users, /admin/transactions, /admin/stats, etc.
from app.routers import admin
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

## Root Endpoint - ตรวจสอบว่า API ทำงานอยู่หรือไม่
## ใช้สำหรับ health check หรือทดสอบการเชื่อมต่อ
@app.get("/")
async def root():
    return {"message": "Library System API is running"}
