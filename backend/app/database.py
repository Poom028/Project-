"""
## Database Configuration - การตั้งค่าและเชื่อมต่อฐานข้อมูล MongoDB

ไฟล์นี้จัดการการเชื่อมต่อกับ MongoDB และการ initialize Beanie ODM
Beanie เป็น ODM (Object Document Mapper) ที่ช่วยให้ทำงานกับ MongoDB ได้ง่ายขึ้น
"""

import os
from urllib.parse import urlparse
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import Book, User, Transaction

## init_db - ฟังก์ชันสำหรับเชื่อมต่อฐานข้อมูล MongoDB
## ฟังก์ชันนี้จะถูกเรียกเมื่อแอปพลิเคชันเริ่มทำงาน (ใน main.py)
async def init_db():
    ## ดึง MongoDB URL จาก environment variable หรือใช้ค่า default
    ## ถ้ามี MONGODB_URL ใน environment variable จะใช้ค่านั้น
    ## ถ้าไม่มีจะใช้ค่า default ที่กำหนดไว้
    mongodb_url = os.getenv(
        "MONGODB_URL", 
        "mongodb://loeitech_admin:G7%23u4sK!8zWb@202.29.231.188:27018/?authSource=admin"
    )
    
    ## ดึงชื่อฐานข้อมูลจาก environment variable หรือใช้ค่า default
    ## ชื่อฐานข้อมูลจะถูกใช้ในการสร้าง/เลือก database ใน MongoDB
    database_name = os.getenv("MONGODB_DB_NAME", "Book_borrowing_and_return_system_Phayu")
    
    ## สร้าง MongoDB Client - เชื่อมต่อกับ MongoDB server
    ## AsyncIOMotorClient เป็น async client สำหรับทำงานกับ MongoDB แบบ asynchronous
    client = AsyncIOMotorClient(mongodb_url)
    
    ## เลือก database ที่ต้องการใช้งาน
    ## client[database_name] จะเลือก database ตามชื่อที่กำหนด
    database = client[database_name]
    
    ## Initialize Beanie - ตั้งค่า Beanie ODM ให้รู้จัก Models ทั้งหมด
    ## document_models คือ list ของ Models ที่ต้องการให้ Beanie จัดการ
    ## หลังจาก init แล้วสามารถใช้ Book.find(), User.find(), Transaction.find() ได้
    await init_beanie(database=database, document_models=[Book, User, Transaction])
