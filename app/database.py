import os
from urllib.parse import urlparse
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import Book, User, Transaction

async def init_db():
    # Get MongoDB URL from environment variable or use default for local
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/library_db")
    
    # Parse database name from URL
    parsed_url = urlparse(mongodb_url)
    database_name = parsed_url.path.lstrip('/') if parsed_url.path else "library_db"
    
    # Remove database name from URL for client connection
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    
    client = AsyncIOMotorClient(base_url)
    
    # Initialize Beanie with the database and models
    database = client[database_name]
    await init_beanie(database=database, document_models=[Book, User, Transaction])
