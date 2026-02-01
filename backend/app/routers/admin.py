"""
## Admin Router - API Endpoints สำหรับ Admin เท่านั้น

ไฟล์นี้จัดการ API endpoints ที่ใช้สำหรับ Admin:
- User Management: ดู, แก้ไข, ลบผู้ใช้
- Statistics: ดูสถิติระบบ
- Transaction Management: ดูและอนุมัติการยืม-คืนหนังสือ

ทุก endpoint ในไฟล์นี้ต้อง login เป็น Admin เท่านั้น
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import User, Book, Transaction
from app.schemas import UserResponse, BookResponse, TransactionResponse
from app.auth import get_current_admin
from beanie import PydanticObjectId

## สร้าง Router สำหรับ admin endpoints
router = APIRouter()

## ============================================
## Admin User Management - จัดการผู้ใช้
## ============================================
## GET /admin/users - ดึงรายการผู้ใช้ทั้งหมด
## Admin only - ใช้สำหรับแสดงรายการผู้ใช้ในหน้า UsersScreen
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(admin: User = Depends(get_current_admin)):
    """Get all users (Admin only)"""
    # ดึงผู้ใช้ทั้งหมดจากฐานข้อมูล
    users = await User.find_all().to_list()
    # แปลงเป็น UserResponse format และส่งกลับ
    return [
        UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at
        )
        for user in users
    ]

## GET /admin/users/{user_id} - ดึงข้อมูลผู้ใช้ตาม ID
## Admin only - ใช้สำหรับดูรายละเอียดผู้ใช้เฉพาะคน
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str, admin: User = Depends(get_current_admin)):
    """Get user by ID (Admin only)"""
    # ค้นหาผู้ใช้จาก ID
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # ส่งข้อมูลผู้ใช้กลับ
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

## PUT /admin/users/{user_id}/role - แก้ไขบทบาทผู้ใช้
## Admin only - ใช้สำหรับเปลี่ยน role จาก "user" เป็น "admin" หรือกลับกัน
@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    new_role: str,
    admin: User = Depends(get_current_admin)
):
    """Update user role (Admin only)"""
    # ตรวจสอบว่า role ที่ส่งมาถูกต้องหรือไม่ (ต้องเป็น "user" หรือ "admin")
    if new_role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'user' or 'admin'")
    
    # ค้นหาผู้ใช้จาก ID
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # อัปเดต role และบันทึกลงฐานข้อมูล
    user.role = new_role
    await user.save()
    
    # ส่งข้อมูลผู้ใช้ที่อัปเดตแล้วกลับไป
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

## DELETE /admin/users/{user_id} - ลบผู้ใช้
## Admin only - ใช้สำหรับลบผู้ใช้ออกจากระบบ
## หมายเหตุ: Admin ไม่สามารถลบบัญชีตัวเองได้
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_current_admin)):
    """Delete user (Admin only)"""
    # ค้นหาผู้ใช้จาก ID
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # ป้องกันการลบบัญชีตัวเอง (เพื่อความปลอดภัย)
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # ลบผู้ใช้ออกจากฐานข้อมูล
    await user.delete()
    return {"message": "User deleted successfully"}

## ============================================
## Admin Statistics - สถิติระบบ
## ============================================

## GET /admin/stats - ดึงสถิติระบบ
## Admin only - ใช้สำหรับแสดงสถิติในหน้า HomeScreen (Admin)
## สถิติที่แสดง: จำนวนผู้ใช้, จำนวนหนังสือ, จำนวน transactions, etc.
@router.get("/stats")
async def get_statistics(admin: User = Depends(get_current_admin)):
    """Get system statistics (Admin only)"""
    # นับจำนวนผู้ใช้ทั้งหมด
    total_users = await User.count()
    # นับจำนวน Admin
    total_admins = await User.find(User.role == "admin").count()
    # นับจำนวนหนังสือทั้งหมด
    total_books = await Book.count()
    # นับจำนวน transactions ทั้งหมด
    total_transactions = await Transaction.count()
    # นับจำนวนการยืมที่กำลังยืมอยู่ (status = "Borrowed")
    active_borrows = await Transaction.find(Transaction.status == "Borrowed").count()
    # นับจำนวนการยืมที่คืนแล้ว (status = "Returned")
    returned_books = await Transaction.find(Transaction.status == "Returned").count()
    
    # ส่งสถิติทั้งหมดกลับไป
    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_regular_users": total_users - total_admins,  # ผู้ใช้ทั่วไป (ไม่ใช่ Admin)
        "total_books": total_books,
        "total_transactions": total_transactions,
        "active_borrows": active_borrows,
        "returned_books": returned_books
    }

## ============================================
## Admin Transaction Management - จัดการการยืม-คืน
## ============================================

## GET /admin/transactions - ดึงรายการ transactions ทั้งหมด
## Admin only - ใช้สำหรับแสดงรายการการยืม-คืนในหน้า TransactionsScreen
@router.get("/transactions", response_model=List[TransactionResponse])
async def get_all_transactions(admin: User = Depends(get_current_admin)):
    """Get all transactions (Admin only)"""
    # ดึง transactions ทั้งหมดจากฐานข้อมูล
    transactions = await Transaction.find_all().to_list()
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

## GET /admin/transactions/{transaction_id} - ดึงข้อมูล transaction ตาม ID
## Admin only - ใช้สำหรับดูรายละเอียด transaction เฉพาะรายการ
@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_by_id(
    transaction_id: str,
    admin: User = Depends(get_current_admin)
):
    """Get transaction by ID (Admin only)"""
    # ค้นหา transaction จาก ID
    transaction = await Transaction.get(PydanticObjectId(transaction_id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    # ส่งข้อมูล transaction กลับ
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

## POST /admin/transactions/{transaction_id}/approve-borrow - อนุมัติการยืมหนังสือ
## Admin only - ใช้เมื่อ Admin กดปุ่ม "อนุมัติ" ในหน้า TransactionsScreen
## หลังจากอนุมัติ: status จะเปลี่ยนเป็น "Borrowed" และ quantity จะลดลง 1
@router.post("/transactions/{transaction_id}/approve-borrow", response_model=TransactionResponse)
async def approve_borrow(
    transaction_id: str,
    admin: User = Depends(get_current_admin)
):
    """Approve a borrow request (Admin only)"""
    # ค้นหา transaction จาก ID
    transaction = await Transaction.get(PydanticObjectId(transaction_id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # ตรวจสอบว่า transaction อยู่ในสถานะ "Pending" หรือไม่
    # ถ้าไม่ใช่ "Pending" แสดงว่าได้รับการอนุมัติหรือถูกยกเลิกไปแล้ว
    if transaction.status != "Pending":
        raise HTTPException(
            status_code=400, 
            detail=f"Transaction is not pending. Current status: {transaction.status}"
        )
    
    # ตรวจสอบว่าหนังสือมีอยู่ในระบบและมีจำนวนพอหรือไม่
    book = await Book.get(PydanticObjectId(transaction.book_id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # ตรวจสอบว่าหนังสือมีจำนวนพอหรือไม่ (อาจมีคนอื่นยืมไปแล้ว)
    if book.quantity < 1:
        raise HTTPException(status_code=400, detail="Book out of stock")
    
    # เปลี่ยน status เป็น "Borrowed" (อนุมัติการยืมแล้ว)
    transaction.status = "Borrowed"
    await transaction.save()
    
    # ลดจำนวนหนังสือลง 1 เล่ม (เพราะถูกยืมไปแล้ว)
    book.quantity -= 1
    await book.save()
    
    # ส่งข้อมูล transaction ที่อัปเดตแล้วกลับไป
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

## POST /admin/transactions/{transaction_id}/approve-return - อนุมัติการคืนหนังสือ
## Admin only - ใช้เมื่อ Admin กดปุ่ม "อนุมัติการคืน" ในหน้า TransactionsScreen
## หลังจากอนุมัติ: status จะเปลี่ยนเป็น "Returned", return_date จะถูกตั้งค่า, และ quantity จะเพิ่มขึ้น 1
@router.post("/transactions/{transaction_id}/approve-return", response_model=TransactionResponse)
async def approve_return(
    transaction_id: str,
    admin: User = Depends(get_current_admin)
):
    """Approve a return request (Admin only)"""
    # ค้นหา transaction จาก ID
    transaction = await Transaction.get(PydanticObjectId(transaction_id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # ตรวจสอบว่า transaction อยู่ในสถานะ "PendingReturn" หรือไม่
    # ถ้าไม่ใช่ "PendingReturn" แสดงว่าไม่ใช่การรออนุมัติการคืน
    if transaction.status != "PendingReturn":
        raise HTTPException(
            status_code=400, 
            detail=f"Transaction is not pending return. Current status: {transaction.status}"
        )
    
    # เปลี่ยน status เป็น "Returned" และตั้งค่า return_date เป็นเวลาปัจจุบัน
    from datetime import datetime
    transaction.return_date = datetime.utcnow()  # บันทึกวันที่คืน
    transaction.status = "Returned"  # เปลี่ยนสถานะเป็นคืนแล้ว
    await transaction.save()
    
    # เพิ่มจำนวนหนังสือขึ้น 1 เล่ม (เพราะคืนแล้ว)
    book = await Book.get(PydanticObjectId(transaction.book_id))
    if book:
        book.quantity += 1
        await book.save()
    
    # ส่งข้อมูล transaction ที่อัปเดตแล้วกลับไป
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )
