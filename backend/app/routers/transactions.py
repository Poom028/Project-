from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.models import Transaction, Book, User
from app.schemas import BorrowRequest, TransactionResponse, ReturnRequest
from app.auth import get_current_active_user
from beanie import PydanticObjectId

router = APIRouter()

@router.post("/borrow", response_model=TransactionResponse)
async def borrow_book(request: BorrowRequest, current_user: User = Depends(get_current_active_user)):
    # Ensure user can only borrow for themselves unless admin
    if str(current_user.id) != request.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to borrow for other users"
        )

    # Validate User
    user = await User.get(PydanticObjectId(request.user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate Book and Availability
    book = await Book.get(PydanticObjectId(request.book_id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.quantity < 1:
        raise HTTPException(status_code=400, detail="Book out of stock")

    # Check if user already has a pending or active borrow for this book
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

    # Create Transaction with Pending status (waiting for admin approval)
    transaction = Transaction(
        user_id=str(user.id),
        book_id=str(book.id),
        status="Pending"
    )
    await transaction.insert()

    # Note: Book quantity is NOT decreased here - it will be decreased when admin approves

    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

@router.post("/return", response_model=TransactionResponse)
async def return_book(request: ReturnRequest, current_user: User = Depends(get_current_active_user)):
    # Ensure user can only return for themselves unless admin
    if str(current_user.id) != request.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to return for other users"
        )

    # Find active transaction (must be Borrowed status)
    transaction = await Transaction.find_one(
        Transaction.book_id == request.book_id,
        Transaction.user_id == request.user_id,
        Transaction.status == "Borrowed"
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Active borrow transaction not found")

    # Update Transaction to PendingReturn (waiting for admin approval)
    transaction.status = "PendingReturn"
    await transaction.save()

    # Note: Book quantity is NOT increased here - it will be increased when admin approves
    
    return TransactionResponse(
        id=str(transaction.id),
        user_id=transaction.user_id,
        book_id=transaction.book_id,
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        status=transaction.status
    )

@router.get("/user/{user_id}", response_model=list[TransactionResponse])
async def get_user_history(user_id: str, current_user: User = Depends(get_current_active_user)):
    # Users can only view their own history, unless they are admin
    if current_user.role != "admin" and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own transaction history"
        )
    transactions = await Transaction.find(Transaction.user_id == user_id).to_list()
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
