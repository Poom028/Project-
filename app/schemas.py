from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Book Schemas
class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    quantity: int

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    quantity: Optional[int] = None

class BookResponse(BookBase):
    id: str

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str

# Transaction Schemas
class BorrowRequest(BaseModel):
    user_id: str
    book_id: str

class ReturnRequest(BaseModel):
    book_id: str
    user_id: str

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    book_id: str
    borrow_date: datetime
    return_date: Optional[datetime] = None
    status: str
