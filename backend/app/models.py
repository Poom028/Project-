from typing import Optional
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

class Book(Document):
    title: str
    author: str
    isbn: Indexed(str, unique=True)
    quantity: int = 0
    image_url: Optional[str] = None

    class Settings:
        name = "books"

class User(Document):
    username: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    password: str  # Hashed password
    role: str = "user"  # "user" or "admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

class Transaction(Document):
    user_id: str  # Storing ID as string for simplicity
    book_id: str
    borrow_date: datetime = Field(default_factory=datetime.utcnow)
    return_date: Optional[datetime] = None
    status: str = "Pending" # Pending, Borrowed, PendingReturn, Returned

    class Settings:
        name = "transactions"
