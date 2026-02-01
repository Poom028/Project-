"""
Script to check books in MongoDB database
Usage: python check_books_in_db.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import Book, User, Transaction

async def check_books():
    # Get MongoDB URL from environment variable or use default
    mongodb_url = os.getenv(
        "MONGODB_URL", 
        "mongodb://loeitech_admin:G7%23u4sK!8zWb@202.29.231.188:27018/?authSource=admin"
    )
    
    # Database name
    database_name = os.getenv("MONGODB_DB_NAME", "Book_borrowing_and_return_system_Phayu")
    
    print("=" * 60)
    print("Checking Books in MongoDB")
    print("=" * 60)
    print(f"Database: {database_name}")
    print(f"Collection: books")
    print("=" * 60)
    print()
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_url)
        database = client[database_name]
        
        # Initialize Beanie
        await init_beanie(database=database, document_models=[Book, User, Transaction])
        
        # Get all books
        books = await Book.find_all().to_list()
        
        print(f"Total books in database: {len(books)}")
        print()
        
        if len(books) == 0:
            print("⚠️  No books found in database!")
            print("   Try adding a book through the web interface.")
        else:
            print("Books in database:")
            print("-" * 60)
            for i, book in enumerate(books, 1):
                print(f"\n[{i}] Book ID: {book.id}")
                print(f"    Title: {book.title}")
                print(f"    Author: {book.author}")
                print(f"    ISBN: {book.isbn}")
                print(f"    Quantity: {book.quantity}")
                if book.image_url:
                    print(f"    Image URL: {book.image_url[:50]}..." if len(book.image_url) > 50 else f"    Image URL: {book.image_url}")
                else:
                    print(f"    Image URL: (none)")
                print("-" * 60)
        
        # Also check using raw MongoDB query
        print("\n" + "=" * 60)
        print("Raw MongoDB Query Results:")
        print("=" * 60)
        books_collection = database["books"]
        raw_books = await books_collection.find({}).to_list(length=100)
        print(f"Total documents in 'books' collection: {len(raw_books)}")
        
        if len(raw_books) > 0:
            print("\nSample document structure:")
            print(raw_books[0])
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_books())
