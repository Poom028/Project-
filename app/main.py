from fastapi import FastAPI
from app.database import init_db
from app.routers import books, users, transactions

app = FastAPI()

@app.on_event("startup")
async def start_db():
    await init_db()

app.include_router(books.router, prefix="/books", tags=["Books"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])

@app.get("/")
async def root():
    return {"message": "Library System API is running"}
