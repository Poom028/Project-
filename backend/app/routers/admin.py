from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import User, Book, Transaction
from app.schemas import UserResponse, BookResponse, TransactionResponse
from app.auth import get_current_admin
from beanie import PydanticObjectId

router = APIRouter()

# Admin User Management
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(admin: User = Depends(get_current_admin)):
    """Get all users (Admin only)"""
    users = await User.find_all().to_list()
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

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str, admin: User = Depends(get_current_admin)):
    """Get user by ID (Admin only)"""
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    new_role: str,
    admin: User = Depends(get_current_admin)
):
    """Update user role (Admin only)"""
    if new_role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'user' or 'admin'")
    
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = new_role
    await user.save()
    
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_current_admin)):
    """Delete user (Admin only)"""
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting yourself
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    await user.delete()
    return {"message": "User deleted successfully"}

# Admin Statistics
@router.get("/stats")
async def get_statistics(admin: User = Depends(get_current_admin)):
    """Get system statistics (Admin only)"""
    total_users = await User.count()
    total_admins = await User.find(User.role == "admin").count()
    total_books = await Book.count()
    total_transactions = await Transaction.count()
    active_borrows = await Transaction.find(Transaction.status == "Borrowed").count()
    returned_books = await Transaction.find(Transaction.status == "Returned").count()
    
    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_regular_users": total_users - total_admins,
        "total_books": total_books,
        "total_transactions": total_transactions,
        "active_borrows": active_borrows,
        "returned_books": returned_books
    }

# Admin Transaction Management
@router.get("/transactions", response_model=List[TransactionResponse])
async def get_all_transactions(admin: User = Depends(get_current_admin)):
    """Get all transactions (Admin only)"""
    transactions = await Transaction.find_all().to_list()
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

@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_by_id(
    transaction_id: str,
    admin: User = Depends(get_current_admin)
):
    """Get transaction by ID (Admin only)"""
    transaction = await Transaction.get(PydanticObjectId(transaction_id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

@router.post("/transactions/{transaction_id}/approve-borrow", response_model=TransactionResponse)
async def approve_borrow(
    transaction_id: str,
    admin: User = Depends(get_current_admin)
):
    """Approve a borrow request (Admin only)"""
    transaction = await Transaction.get(PydanticObjectId(transaction_id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.status != "Pending":
        raise HTTPException(
            status_code=400, 
            detail=f"Transaction is not pending. Current status: {transaction.status}"
        )
    
    # Validate Book and Availability
    book = await Book.get(PydanticObjectId(transaction.book_id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.quantity < 1:
        raise HTTPException(status_code=400, detail="Book out of stock")
    
    # Update transaction status to Borrowed
    transaction.status = "Borrowed"
    await transaction.save()
    
    # Decrease Book Quantity
    book.quantity -= 1
    await book.save()
    
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

@router.post("/transactions/{transaction_id}/approve-return", response_model=TransactionResponse)
async def approve_return(
    transaction_id: str,
    admin: User = Depends(get_current_admin)
):
    """Approve a return request (Admin only)"""
    transaction = await Transaction.get(PydanticObjectId(transaction_id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.status != "PendingReturn":
        raise HTTPException(
            status_code=400, 
            detail=f"Transaction is not pending return. Current status: {transaction.status}"
        )
    
    # Update transaction status to Returned
    from datetime import datetime
    transaction.return_date = datetime.utcnow()
    transaction.status = "Returned"
    await transaction.save()
    
    # Increase Book Quantity
    book = await Book.get(PydanticObjectId(transaction.book_id))
    if book:
        book.quantity += 1
        await book.save()
    
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )
