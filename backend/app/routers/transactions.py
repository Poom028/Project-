"""
## Transactions Router - API Endpoints สำหรับการยืม-คืนหนังสือ

ไฟล์นี้จัดการ API endpoints ที่เกี่ยวข้องกับการยืม-คืนหนังสือ:
- POST /transactions/borrow - ยืมหนังสือ (สร้าง transaction แบบ Pending)
- POST /transactions/return - คืนหนังสือ (เปลี่ยน status เป็น PendingReturn)
- GET /transactions/user/{user_id} - ดูประวัติการยืม-คืนของผู้ใช้

หมายเหตุ: การยืม-คืนต้องผ่านการอนุมัติจาก Admin ก่อน
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.models import Transaction, Book, User
from app.schemas import BorrowRequest, TransactionResponse, ReturnRequest
from app.auth import get_current_active_user
from beanie import PydanticObjectId

## สร้าง Router สำหรับ transactions endpoints
router = APIRouter()

## POST /transactions/borrow - ยืมหนังสือ
## Protected endpoint - ต้อง login
## สร้าง transaction แบบ Pending (รอ Admin อนุมัติ)
## หลังจาก Admin อนุมัติ status จะเปลี่ยนเป็น Borrowed และ quantity จะลดลง
@router.post("/borrow", response_model=TransactionResponse)
async def borrow_book(request: BorrowRequest, current_user: User = Depends(get_current_active_user)):
    # ตรวจสอบสิทธิ์: ผู้ใช้สามารถยืมให้ตัวเองเท่านั้น (ยกเว้น Admin)
    # Admin สามารถยืมให้ผู้ใช้คนอื่นได้
    if str(current_user.id) != request.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to borrow for other users"
        )

    # ตรวจสอบว่าผู้ใช้มีอยู่ในระบบหรือไม่
    user = await User.get(PydanticObjectId(request.user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ตรวจสอบว่าหนังสือมีอยู่ในระบบและมีจำนวนพอหรือไม่
    book = await Book.get(PydanticObjectId(request.book_id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # ตรวจสอบว่าหนังสือมีจำนวนพอหรือไม่ (quantity >= 1)
    if book.quantity < 1:
        raise HTTPException(status_code=400, detail="Book out of stock")

    # ตรวจสอบว่าผู้ใช้มี transaction ที่รออนุมัติหรือกำลังยืมอยู่แล้วหรือไม่
    # ป้องกันการยืมซ้ำ (ไม่ให้ยืมหนังสือเล่มเดียวกันซ้ำ)
    existing_pending = await Transaction.find_one(
        Transaction.book_id == request.book_id,
        Transaction.user_id == request.user_id,
        Transaction.status == "Pending"
    )
    existing_borrowed = await Transaction.find_one(
        Transaction.book_id == request.book_id,
        Transaction.user_id == request.user_id,
        Transaction.status == "Borrowed"
    )
    existing_transaction = existing_pending or existing_borrowed
    
    if existing_transaction:
        raise HTTPException(
            status_code=400, 
            detail="You already have a pending or active borrow request for this book"
        )

    # สร้าง Transaction ใหม่ด้วย status = "Pending" (รอ Admin อนุมัติ)
    # หลังจาก Admin อนุมัติ status จะเปลี่ยนเป็น "Borrowed"
    transaction = Transaction(
        user_id=str(user.id),
        book_id=str(book.id),
        status="Pending"
    )
    await transaction.insert()

    # หมายเหตุ: จำนวนหนังสือ (quantity) ยังไม่ลดลงที่นี่
    # จะลดลงเมื่อ Admin อนุมัติการยืม (ใน admin.py)

    # ส่งข้อมูล transaction กลับไป
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

## POST /transactions/return - คืนหนังสือ
## Protected endpoint - ต้อง login
## เปลี่ยน status จาก "Borrowed" เป็น "PendingReturn" (รอ Admin อนุมัติ)
## หลังจาก Admin อนุมัติ status จะเปลี่ยนเป็น "Returned" และ quantity จะเพิ่มขึ้น
@router.post("/return", response_model=TransactionResponse)
async def return_book(request: ReturnRequest, current_user: User = Depends(get_current_active_user)):
    # ตรวจสอบสิทธิ์: ผู้ใช้สามารถคืนให้ตัวเองเท่านั้น (ยกเว้น Admin)
    if str(current_user.id) != request.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to return for other users"
        )

    # ค้นหา transaction ที่กำลังยืมอยู่ (status ต้องเป็น "Borrowed")
    # ไม่สามารถคืนหนังสือที่ยังไม่ได้รับการอนุมัติการยืม
    transaction = await Transaction.find_one(
        Transaction.book_id == request.book_id,
        Transaction.user_id == request.user_id,
        Transaction.status == "Borrowed"
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Active borrow transaction not found")

    # เปลี่ยน status เป็น "PendingReturn" (รอ Admin อนุมัติการคืน)
    transaction.status = "PendingReturn"
    await transaction.save()

    # หมายเหตุ: จำนวนหนังสือ (quantity) ยังไม่เพิ่มขึ้นที่นี่
    # จะเพิ่มขึ้นเมื่อ Admin อนุมัติการคืน (ใน admin.py)
    
    # ส่งข้อมูล transaction ที่อัปเดตแล้วกลับไป
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

## GET /transactions/user/{user_id} - ดูประวัติการยืม-คืนของผู้ใช้
## Protected endpoint - ต้อง login
## ผู้ใช้สามารถดูประวัติของตัวเองเท่านั้น (ยกเว้น Admin ที่ดูได้ทุกคน)
@router.get("/user/{user_id}", response_model=list[TransactionResponse])
async def get_user_history(user_id: str, current_user: User = Depends(get_current_active_user)):
    # ตรวจสอบสิทธิ์: ผู้ใช้สามารถดูประวัติของตัวเองเท่านั้น (ยกเว้น Admin)
    if current_user.role != "admin" and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own transaction history"
        )
    
    # ดึง transactions ทั้งหมดของผู้ใช้คนนี้
    transactions = await Transaction.find(Transaction.user_id == user_id).to_list()
    
    # แปลงเป็น TransactionResponse format และส่งกลับ
    return [
        TransactionResponse(
            id=str(t.id),
            user_id=t.user_id,
            book_id=t.book_id,
            borrow_date=t.borrow_date,
            return_date=t.return_date,
            status=t.status
        )
        for t in transactions
    ]
