from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Book Schemas
class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    quantity: int
    image_url: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    quantity: Optional[int] = None
    image_url: Optional[str] = None

class BookResponse(BookBase):
    id: str

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str
    role: str = "user"  # Default to "user", can be set to "admin"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

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
