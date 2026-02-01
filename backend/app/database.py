import os
from urllib.parse import urlparse
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import Book, User, Transaction

async def init_db():
    # Get MongoDB URL from environment variable or use default
    mongodb_url = os.getenv(
        "MONGODB_URL", 
        "mongodb://loeitech_admin:G7%23u4sK!8zWb@202.29.231.188:27018/?authSource=admin"
    )
    
    # Database name
    database_name = os.getenv("MONGODB_DB_NAME", "Book_borrowing_and_return_system_Phayu")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongodb_url)
    
    # Initialize Beanie with the database and models
    database = client[database_name]
    await init_beanie(database=database, document_models=[Book, User, Transaction])
