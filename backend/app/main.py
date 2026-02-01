from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import books, users, transactions, auth

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def start_db():
    await init_db()
    # Create default admin if it doesn't exist
    await create_default_admin()

async def create_default_admin():
    """Create default admin user if it doesn't exist"""
    from app.models import User
    from app.auth import get_password_hash
    
    admin_username = "admin"
    admin_email = "admin@library.com"
    admin_password = "admin123"  # Default password - should be changed in production
    
    # Check if admin already exists
    existing_admin = await User.find_one(User.username == admin_username)
    if not existing_admin:
        # Check if email already exists
        existing_email = await User.find_one(User.email == admin_email)
        if not existing_email:
            hashed_password = get_password_hash(admin_password)
            admin_user = User(
                username=admin_username,
                email=admin_email,
                password=hashed_password,
                role="admin"
            )
            await admin_user.insert()
            print(f"✅ Default admin user created!")
            print(f"   Username: {admin_username}")
            print(f"   Password: {admin_password}")
            print(f"   ⚠️  Please change the password after first login!")

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(books.router, prefix="/books", tags=["Books"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])

# Import admin router
from app.routers import admin
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

@app.get("/")
async def root():
    return {"message": "Library System API is running"}
