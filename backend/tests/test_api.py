import pytest
from httpx import AsyncClient

# Helper function to get admin token
async def get_admin_token(client: AsyncClient):
    # Register admin user
    await client.post("/auth/register", json={
        "username": "admin",
        "email": "admin@test.com",
        "password": "admin123"
    })
    # Login to get token
    response = await client.post("/auth/login-json", json={
        "username": "admin",
        "password": "admin123"
    })
    return response.json()["access_token"]

# Helper function to get user token
async def get_user_token(client: AsyncClient, username="testuser", email="test@example.com", password="testpass123"):
    # Register user
    await client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    # Login to get token
    response = await client.post("/auth/login-json", json={
        "username": username,
        "password": password
    })
    return response.json()["access_token"]

# 1. Create User (Success) - Register
@pytest.mark.asyncio
async def test_create_user(validation_client: AsyncClient):
    payload = {"username": "testuser", "email": "test@example.com", "password": "testpass123"}
    response = await validation_client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data

# 2. Create Book (Success) - Requires Admin
@pytest.mark.asyncio
async def test_create_book(validation_client: AsyncClient):
    admin_token = await get_admin_token(validation_client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"title": "Test Book", "author": "Author One", "isbn": "1234567890", "quantity": 5}
    response = await validation_client.post("/books/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Book"
    assert data["quantity"] == 5

# 3. Get Book List - Public endpoint
@pytest.mark.asyncio
async def test_get_books(validation_client: AsyncClient):
    # Create a book first (as admin)
    admin_token = await get_admin_token(validation_client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    await validation_client.post("/books/", json={"title": "B1", "author": "A1", "isbn": "111", "quantity": 1}, headers=headers)
    
    response = await validation_client.get("/books/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

# 4. Borrow Book (Success) - Now returns "Pending" status
@pytest.mark.asyncio
async def test_borrow_book_success(validation_client: AsyncClient):
    # Setup: Create admin, book, and user
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "u1", "e1@test.com", "pass123")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book as admin
    book = await validation_client.post("/books/", json={"title": "b1", "author": "a1", "isbn": "222", "quantity": 1}, headers=admin_headers)
    book_id = book.json()["id"]
    
    # Get user info
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]

    # Action: Borrow (returns Pending status)
    response = await validation_client.post("/transactions/borrow", json={"user_id": user_id, "book_id": book_id}, headers=user_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "Pending"  # Changed from "Borrowed"

    # Verify Quantity NOT Decreased (because it's pending)
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 1  # Still 1, not decreased yet

# 5. Borrow Book (Fail - Out of stock)
@pytest.mark.asyncio
async def test_borrow_book_out_of_stock(validation_client: AsyncClient):
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "u2", "e2@test.com", "pass123")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book with 0 quantity
    book = await validation_client.post("/books/", json={"title": "b2", "author": "a2", "isbn": "333", "quantity": 0}, headers=admin_headers)
    book_id = book.json()["id"]
    
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]

    # Action
    response = await validation_client.post("/transactions/borrow", json={"user_id": user_id, "book_id": book_id}, headers=user_headers)
    assert response.status_code == 400
    assert "out of stock" in response.json()["detail"].lower()

# 6. Return Book (Success) - Need to approve borrow first
@pytest.mark.asyncio
async def test_return_book_success(validation_client: AsyncClient):
    # Setup: Create admin, book, and user
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "u3", "e3@test.com", "pass123")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={"title": "b4", "author": "a4", "isbn": "555", "quantity": 1}, headers=admin_headers)
    book_id = book.json()["id"]
    
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    # Borrow (creates Pending transaction)
    borrow_response = await validation_client.post("/transactions/borrow", json={"user_id": user_id, "book_id": book_id}, headers=user_headers)
    transaction_id = borrow_response.json()["id"]
    
    # Approve borrow (admin action)
    await validation_client.post(f"/admin/transactions/{transaction_id}/approve-borrow", headers=admin_headers)
    
    # Action: Return (creates PendingReturn status)
    response = await validation_client.post("/transactions/return", json={"user_id": user_id, "book_id": book_id}, headers=user_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "PendingReturn"  # Changed from "Returned"

    # Verify Quantity NOT Increased (because it's pending return)
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 0  # Still 0, not increased yet

# 7. Return Book (Fail - Transaction not found or not borrowed)
@pytest.mark.asyncio
async def test_return_book_no_transaction(validation_client: AsyncClient):
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "u4", "e4@test.com", "pass123")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={"title": "b5", "author": "a5", "isbn": "666", "quantity": 1}, headers=admin_headers)
    book_id = book.json()["id"]
    
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    # Try to return without borrowing
    response = await validation_client.post("/transactions/return", json={"user_id": user_id, "book_id": book_id}, headers=user_headers)
    assert response.status_code == 404

# 8. Get User Borrow History
@pytest.mark.asyncio
async def test_get_user_history(validation_client: AsyncClient):
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "u6", "e6@test.com", "pass123")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={"title": "b7", "author": "a7", "isbn": "888", "quantity": 1}, headers=admin_headers)
    book_id = book.json()["id"]
    
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    # Borrow
    await validation_client.post("/transactions/borrow", json={"user_id": user_id, "book_id": book_id}, headers=user_headers)
    
    # Get history
    response = await validation_client.get(f"/transactions/user/{user_id}", headers=user_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

# 9. Delete Book - Requires Admin
@pytest.mark.asyncio
async def test_delete_book(validation_client: AsyncClient):
    admin_token = await get_admin_token(validation_client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={"title": "b8", "author": "a8", "isbn": "999", "quantity": 1}, headers=headers)
    bid = book.json()["id"]
    
    # Delete book
    response = await validation_client.delete(f"/books/{bid}", headers=headers)
    assert response.status_code == 200
    
    # Verify deleted
    check = await validation_client.get(f"/books/{bid}")
    assert check.status_code == 404

# 10. Check ISBN Uniqueness - Requires Admin
@pytest.mark.asyncio
async def test_isbn_uniqueness(validation_client: AsyncClient):
    admin_token = await get_admin_token(validation_client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create first book
    await validation_client.post("/books/", json={"title": "b9", "author": "a9", "isbn": "000", "quantity": 1}, headers=headers)
    
    # Try to create duplicate ISBN
    response = await validation_client.post("/books/", json={"title": "b10", "author": "a10", "isbn": "000", "quantity": 1}, headers=headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
