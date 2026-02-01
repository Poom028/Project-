"""
Script to create an admin user
Run this script to create an admin account in the database
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import User
from app.auth import get_password_hash

async def create_admin():
    # MongoDB connection
    mongodb_url = "mongodb://loeitech_admin:G7%23u4sK!8zWb@202.29.231.188:27018/?authSource=admin"
    database_name = "Book_borrowing_and_return_system_Phayu"
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongodb_url)
    database = client[database_name]
    
    # Initialize Beanie
    await init_beanie(database=database, document_models=[User])
    
    # Admin credentials
    admin_username = "admin"
    admin_email = "admin@library.com"
    admin_password = "admin123"  # Change this to a secure password
    
    # Check if admin already exists
    existing_admin = await User.find_one(User.username == admin_username)
    if existing_admin:
        print(f"❌ Admin user '{admin_username}' already exists!")
        print(f"   Email: {existing_admin.email}")
        print(f"   Role: {existing_admin.role}")
        return
    
    # Check if email already exists
    existing_email = await User.find_one(User.email == admin_email)
    if existing_email:
        print(f"❌ Email '{admin_email}' is already registered!")
        return
    
    # Create admin user
    hashed_password = get_password_hash(admin_password)
    admin_user = User(
        username=admin_username,
        email=admin_email,
        password=hashed_password,
        role="admin"
    )
    await admin_user.insert()
    
    print("✅ Admin user created successfully!")
    print(f"   Username: {admin_username}")
    print(f"   Email: {admin_email}")
    print(f"   Password: {admin_password}")
    print(f"   Role: admin")
    print("\n⚠️  Please change the password after first login!")

if __name__ == "__main__":
    asyncio.run(create_admin())
