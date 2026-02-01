"""
## Books Router - API Endpoints สำหรับจัดการหนังสือ

ไฟล์นี้จัดการ API endpoints ทั้งหมดที่เกี่ยวข้องกับหนังสือ:
- GET /books/ - ดึงรายการหนังสือทั้งหมด
- GET /books/{id} - ดึงข้อมูลหนังสือตาม ID
- POST /books/ - สร้างหนังสือใหม่ (Admin only)
- PUT /books/{id} - แก้ไขข้อมูลหนังสือ (Admin only)
- DELETE /books/{id} - ลบหนังสือ (Admin only)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import Book, User
from app.schemas import BookCreate, BookResponse, BookUpdate
from app.auth import get_current_active_user, get_current_admin
from beanie import PydanticObjectId

## สร้าง Router สำหรับ books endpoints
router = APIRouter()

## GET /books/ - ดึงรายการหนังสือทั้งหมด
## Public endpoint - ไม่ต้อง login ก็ดูได้
## ใช้สำหรับแสดงรายการหนังสือในหน้าแรกหรือหน้า UserBorrowScreen
@router.get("/", response_model=List[BookResponse])
async def get_books():
    """Get all books (Public - no authentication required)"""
    # ดึงหนังสือทั้งหมดจากฐานข้อมูล
    books = await Book.find_all().to_list()
    # แปลงเป็น BookResponse format และส่งกลับ
    return [BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity, image_url=book.image_url) for book in books]

## GET /books/{id} - ดึงข้อมูลหนังสือตาม ID
## Public endpoint - ไม่ต้อง login ก็ดูได้
## ใช้สำหรับดูรายละเอียดหนังสือเฉพาะเล่ม
@router.get("/{id}", response_model=BookResponse)
async def get_book(id: str):
    """Get book by ID (Public - no authentication required)"""
    # ค้นหาหนังสือจาก ID
    book = await Book.get(PydanticObjectId(id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    # ส่งข้อมูลหนังสือกลับ
    return BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity, image_url=book.image_url)

## POST /books/ - สร้างหนังสือใหม่
## Admin only - ต้อง login เป็น Admin เท่านั้น
## ใช้เมื่อ Admin เพิ่มหนังสือใหม่ในระบบ (รวมถึงอัปโหลดรูปภาพ)
@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(book_in: BookCreate, admin: User = Depends(get_current_admin)):
    """Create a new book (Admin only)"""
    # ตรวจสอบว่า ISBN ซ้ำหรือไม่ (ISBN ต้องไม่ซ้ำกัน)
    existing_book = await Book.find_one(Book.isbn == book_in.isbn)
    if existing_book:
        raise HTTPException(status_code=400, detail="Book with this ISBN already exists")
    
    # แปลงข้อมูลจาก BookCreate schema เป็น dictionary
    # รวมถึง image_url ถ้ามี
    book_data = book_in.model_dump()
    print(f"[DEBUG] Creating book with data: {book_data}")  # Debug log
    
    # สร้าง Book object และบันทึกลงฐานข้อมูล
    book = Book(**book_data)
    await book.insert()
    
    print(f"[DEBUG] Book created successfully with ID: {book.id}")  # Debug log
    print(f"[DEBUG] Book saved to MongoDB - Title: {book.title}, ISBN: {book.isbn}, Image URL: {book.image_url}")  # Debug log
    
    # ส่งข้อมูลหนังสือที่สร้างแล้วกลับไป
    return BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity, image_url=book.image_url)

## PUT /books/{id} - แก้ไขข้อมูลหนังสือ
## Admin only - ต้อง login เป็น Admin เท่านั้น
## ใช้เมื่อ Admin แก้ไขข้อมูลหนังสือ (ชื่อ, ผู้แต่ง, จำนวน, รูปภาพ)
## หมายเหตุ: ISBN ไม่สามารถแก้ไขได้ (เพื่อป้องกันปัญหา)
@router.put("/{id}", response_model=BookResponse)
async def update_book(id: str, book_update: BookUpdate, admin: User = Depends(get_current_admin)):
    """Update book (Admin only)"""
    # ค้นหาหนังสือจาก ID
    book = await Book.get(PydanticObjectId(id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # แปลงข้อมูลที่ต้องการอัปเดต (เฉพาะ field ที่ส่งมา)
    # exclude_unset=True หมายความว่าถ้า field ไม่ได้ส่งมา จะไม่ update field นั้น
    update_data = book_update.model_dump(exclude_unset=True)
    await book.set(update_data)  # อัปเดตข้อมูลในฐานข้อมูล
    
    # ส่งข้อมูลหนังสือที่อัปเดตแล้วกลับไป
    return BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity, image_url=book.image_url)

## DELETE /books/{id} - ลบหนังสือ
## Admin only - ต้อง login เป็น Admin เท่านั้น
## ใช้เมื่อ Admin ลบหนังสือออกจากระบบ
@router.delete("/{id}")
async def delete_book(id: str, admin: User = Depends(get_current_admin)):
    """Delete book (Admin only)"""
    # ค้นหาหนังสือจาก ID
    book = await Book.get(PydanticObjectId(id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # ลบหนังสือออกจากฐานข้อมูล
    await book.delete()
    return {"message": "Book deleted successfully"}
