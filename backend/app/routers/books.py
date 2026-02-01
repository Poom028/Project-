from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import Book, User
from app.schemas import BookCreate, BookResponse, BookUpdate
from app.auth import get_current_active_user, get_current_admin
from beanie import PydanticObjectId

router = APIRouter()

@router.get("/", response_model=List[BookResponse])
async def get_books():
    """Get all books (Public - no authentication required)"""
    books = await Book.find_all().to_list()
    return [BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity) for book in books]

@router.get("/{id}", response_model=BookResponse)
async def get_book(id: str):
    """Get book by ID (Public - no authentication required)"""
    book = await Book.get(PydanticObjectId(id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity)

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(book_in: BookCreate, admin: User = Depends(get_current_admin)):
    """Create a new book (Admin only)"""
    # Check for duplicate ISBN
    existing_book = await Book.find_one(Book.isbn == book_in.isbn)
    if existing_book:
        raise HTTPException(status_code=400, detail="Book with this ISBN already exists")
    
    book = Book(**book_in.model_dump())
    await book.insert()
    return BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity)

@router.put("/{id}", response_model=BookResponse)
async def update_book(id: str, book_update: BookUpdate, admin: User = Depends(get_current_admin)):
    """Update book (Admin only)"""
    book = await Book.get(PydanticObjectId(id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    update_data = book_update.model_dump(exclude_unset=True)
    await book.set(update_data)
    return BookResponse(id=str(book.id), title=book.title, author=book.author, isbn=book.isbn, quantity=book.quantity)

@router.delete("/{id}")
async def delete_book(id: str, admin: User = Depends(get_current_admin)):
    """Delete book (Admin only)"""
    book = await Book.get(PydanticObjectId(id))
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    await book.delete()
    return {"message": "Book deleted successfully"}
