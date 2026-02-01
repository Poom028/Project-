import pytest
import pytest_asyncio
import os
from httpx import AsyncClient, ASGITransport
from urllib.parse import urlparse
from app.main import app
from app.database import init_db
from app.models import Book, User, Transaction
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Use a separate database for testing
# ถ้ารันใน Docker container ใช้ db:27017, ถ้ารันโดยตรงใช้ localhost:27017
TEST_MONGODB_HOST = os.getenv("TEST_MONGODB_HOST", "localhost")
TEST_MONGODB_URL = f"mongodb://{TEST_MONGODB_HOST}:27017/test_library_db"

@pytest_asyncio.fixture(scope="function")
async def validation_client():
    # Parse database name from URL
    parsed_url = urlparse(TEST_MONGODB_URL)
    database_name = parsed_url.path.lstrip('/') if parsed_url.path else "test_library_db"
    
    # Remove database name from URL for client connection
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    
    # Initialize Beanie with Test DB
    client = AsyncIOMotorClient(base_url)
    database = client[database_name]
    await init_beanie(database=database, document_models=[Book, User, Transaction])
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    # Cleanup after tests
    await client.drop_database(database_name)
    client.close()

@pytest_asyncio.fixture(autouse=True, scope="function")
async def clear_db(validation_client):
    # Clear collections before each test to ensure isolation
    # This fixture depends on validation_client to ensure Beanie is initialized
    # และใช้ event loop เดียวกับ validation_client
    try:
        await Book.delete_all()
        await User.delete_all()
        await Transaction.delete_all()
    except Exception:
        pass  # Ignore errors if collections don't exist yet
    yield
    # Cleanup after each test
    try:
        await Book.delete_all()
        await User.delete_all()
        await Transaction.delete_all()
    except Exception:
        pass
