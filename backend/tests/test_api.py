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

# ============================================
# Additional Test Cases - เพิ่มเติม
# ============================================

# 11. Test Login with Invalid Credentials
@pytest.mark.asyncio
async def test_login_invalid_credentials(validation_client: AsyncClient):
    """Test login with wrong username or password"""
    # Register a user first
    await validation_client.post("/auth/register", json={
        "username": "testuser_login",
        "email": "testlogin@example.com",
        "password": "correctpass123"
    })
    
    # Try login with wrong password
    response = await validation_client.post("/auth/login-json", json={
        "username": "testuser_login",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]
    
    # Try login with wrong username
    response = await validation_client.post("/auth/login-json", json={
        "username": "nonexistent",
        "password": "correctpass123"
    })
    assert response.status_code == 401

# 12. Test Register with Duplicate Username
@pytest.mark.asyncio
async def test_register_duplicate_username(validation_client: AsyncClient):
    """Test registering with existing username"""
    # Register first user
    await validation_client.post("/auth/register", json={
        "username": "duplicate_user",
        "email": "first@example.com",
        "password": "pass123"
    })
    
    # Try to register with same username
    response = await validation_client.post("/auth/register", json={
        "username": "duplicate_user",
        "email": "second@example.com",
        "password": "pass123"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

# 13. Test Register with Duplicate Email
@pytest.mark.asyncio
async def test_register_duplicate_email(validation_client: AsyncClient):
    """Test registering with existing email"""
    # Register first user
    await validation_client.post("/auth/register", json={
        "username": "user1",
        "email": "duplicate@example.com",
        "password": "pass123"
    })
    
    # Try to register with same email
    response = await validation_client.post("/auth/register", json={
        "username": "user2",
        "email": "duplicate@example.com",
        "password": "pass123"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

# 14. Test Get Current User (Me) - Requires Authentication
@pytest.mark.asyncio
async def test_get_me_requires_auth(validation_client: AsyncClient):
    """Test that /auth/me requires authentication"""
    # Try without token
    response = await validation_client.get("/auth/me")
    assert response.status_code == 401
    
    # Try with valid token
    user_token = await get_user_token(validation_client, "me_user", "me@test.com")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await validation_client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == "me_user"

# 15. Test Create Book with Image URL
@pytest.mark.asyncio
async def test_create_book_with_image(validation_client: AsyncClient):
    """Test creating book with image_url field"""
    admin_token = await get_admin_token(validation_client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "title": "Book with Image",
        "author": "Author",
        "isbn": "ISBN123456",
        "quantity": 5,
        "image_url": "http://example.com/image.jpg"
    }
    response = await validation_client.post("/books/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["image_url"] == "http://example.com/image.jpg"

# 16. Test Update Book
@pytest.mark.asyncio
async def test_update_book(validation_client: AsyncClient):
    """Test updating book information"""
    admin_token = await get_admin_token(validation_client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={
        "title": "Original Title",
        "author": "Original Author",
        "isbn": "ISBN999",
        "quantity": 10
    }, headers=headers)
    book_id = book.json()["id"]
    
    # Update book
    response = await validation_client.put(f"/books/{book_id}", json={
        "title": "Updated Title",
        "quantity": 20
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["quantity"] == 20
    assert data["author"] == "Original Author"  # Should remain unchanged

# 17. Test Update Book Image URL
@pytest.mark.asyncio
async def test_update_book_image(validation_client: AsyncClient):
    """Test updating book image URL"""
    admin_token = await get_admin_token(validation_client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create book with image
    book = await validation_client.post("/books/", json={
        "title": "Book",
        "author": "Author",
        "isbn": "ISBN888",
        "quantity": 1,
        "image_url": "http://example.com/old.jpg"
    }, headers=headers)
    book_id = book.json()["id"]
    
    # Update image URL
    response = await validation_client.put(f"/books/{book_id}", json={
        "image_url": "http://example.com/new.jpg"
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["image_url"] == "http://example.com/new.jpg"

# 18. Test Admin Approve Borrow
@pytest.mark.asyncio
async def test_admin_approve_borrow(validation_client: AsyncClient):
    """Test admin approving a borrow request"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "approve_user", "approve@test.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={
        "title": "Approve Book",
        "author": "Author",
        "isbn": "ISBN777",
        "quantity": 1
    }, headers=admin_headers)
    book_id = book.json()["id"]
    
    # Get user ID
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    # User borrows (creates Pending transaction)
    borrow_response = await validation_client.post("/transactions/borrow", json={
        "user_id": user_id,
        "book_id": book_id
    }, headers=user_headers)
    transaction_id = borrow_response.json()["id"]
    assert borrow_response.json()["status"] == "Pending"
    
    # Verify quantity not decreased yet
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 1
    
    # Admin approves
    approve_response = await validation_client.post(
        f"/admin/transactions/{transaction_id}/approve-borrow",
        headers=admin_headers
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "Borrowed"
    
    # Verify quantity decreased
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 0

# 19. Test Admin Approve Return
@pytest.mark.asyncio
async def test_admin_approve_return(validation_client: AsyncClient):
    """Test admin approving a return request"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "return_user", "return@test.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={
        "title": "Return Book",
        "author": "Author",
        "isbn": "ISBN666",
        "quantity": 1
    }, headers=admin_headers)
    book_id = book.json()["id"]
    
    # Get user ID
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    # Borrow and approve
    borrow_response = await validation_client.post("/transactions/borrow", json={
        "user_id": user_id,
        "book_id": book_id
    }, headers=user_headers)
    transaction_id = borrow_response.json()["id"]
    await validation_client.post(
        f"/admin/transactions/{transaction_id}/approve-borrow",
        headers=admin_headers
    )
    
    # User returns (creates PendingReturn)
    return_response = await validation_client.post("/transactions/return", json={
        "user_id": user_id,
        "book_id": book_id
    }, headers=user_headers)
    assert return_response.json()["status"] == "PendingReturn"
    
    # Verify quantity not increased yet
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 0
    
    # Admin approves return
    approve_response = await validation_client.post(
        f"/admin/transactions/{transaction_id}/approve-return",
        headers=admin_headers
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "Returned"
    assert approve_response.json()["return_date"] is not None
    
    # Verify quantity increased
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 1

# 20. Test Admin Get All Users
@pytest.mark.asyncio
async def test_admin_get_all_users(validation_client: AsyncClient):
    """Test admin getting list of all users"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create some users
    await get_user_token(validation_client, "user1", "user1@test.com")
    await get_user_token(validation_client, "user2", "user2@test.com")
    
    # Admin gets all users
    response = await validation_client.get("/admin/users", headers=admin_headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 3  # At least admin + 2 users

# 21. Test Admin Update User Role
@pytest.mark.asyncio
async def test_admin_update_user_role(validation_client: AsyncClient):
    """Test admin updating user role"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a regular user
    user_token = await get_user_token(validation_client, "role_user", "role@test.com")
    user_info = await validation_client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    user_id = user_info.json()["id"]
    assert user_info.json()["role"] == "user"
    
    # Admin updates role to admin
    response = await validation_client.put(
        f"/admin/users/{user_id}/role?new_role=admin",
        headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"

# 22. Test Admin Delete User
@pytest.mark.asyncio
async def test_admin_delete_user(validation_client: AsyncClient):
    """Test admin deleting a user"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a user
    user_token = await get_user_token(validation_client, "delete_user", "delete@test.com")
    user_info = await validation_client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    user_id = user_info.json()["id"]
    
    # Admin deletes user
    response = await validation_client.delete(f"/admin/users/{user_id}", headers=admin_headers)
    assert response.status_code == 200
    
    # Verify user is deleted
    response = await validation_client.get(f"/admin/users/{user_id}", headers=admin_headers)
    assert response.status_code == 404

# 23. Test Admin Get Statistics
@pytest.mark.asyncio
async def test_admin_get_stats(validation_client: AsyncClient):
    """Test admin getting system statistics"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create some data
    await get_user_token(validation_client, "stats_user", "stats@test.com")
    await validation_client.post("/books/", json={
        "title": "Stats Book",
        "author": "Author",
        "isbn": "ISBN555",
        "quantity": 5
    }, headers=admin_headers)
    
    # Get stats
    response = await validation_client.get("/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    stats = response.json()
    assert "total_users" in stats
    assert "total_books" in stats
    assert "total_transactions" in stats
    assert "active_borrows" in stats
    assert stats["total_users"] >= 2  # At least admin + 1 user
    assert stats["total_books"] >= 1

# 24. Test Admin Get All Transactions
@pytest.mark.asyncio
async def test_admin_get_all_transactions(validation_client: AsyncClient):
    """Test admin getting all transactions"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "trans_user", "trans@test.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book and borrow
    book = await validation_client.post("/books/", json={
        "title": "Trans Book",
        "author": "Author",
        "isbn": "ISBN444",
        "quantity": 1
    }, headers=admin_headers)
    book_id = book.json()["id"]
    
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    await validation_client.post("/transactions/borrow", json={
        "user_id": user_id,
        "book_id": book_id
    }, headers=user_headers)
    
    # Admin gets all transactions
    response = await validation_client.get("/admin/transactions", headers=admin_headers)
    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) >= 1

# 25. Test Unauthorized Access (User trying to access Admin endpoints)
@pytest.mark.asyncio
async def test_unauthorized_admin_access(validation_client: AsyncClient):
    """Test that regular users cannot access admin endpoints"""
    user_token = await get_user_token(validation_client, "unauth_user", "unauth@test.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Try to access admin endpoints
    response = await validation_client.get("/admin/users", headers=user_headers)
    assert response.status_code == 403
    
    response = await validation_client.get("/admin/stats", headers=user_headers)
    assert response.status_code == 403

# 26. Test Create Book Without Admin Token
@pytest.mark.asyncio
async def test_create_book_requires_admin(validation_client: AsyncClient):
    """Test that creating book requires admin token"""
    user_token = await get_user_token(validation_client, "book_user", "book@test.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Try to create book as regular user
    response = await validation_client.post("/books/", json={
        "title": "Test",
        "author": "Author",
        "isbn": "ISBN333",
        "quantity": 1
    }, headers=user_headers)
    assert response.status_code == 403

# 27. Test Get Book by ID Not Found
@pytest.mark.asyncio
async def test_get_book_not_found(validation_client: AsyncClient):
    """Test getting non-existent book"""
    response = await validation_client.get("/books/507f1f77bcf86cd799439011")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

# 28. Test Approve Borrow with Invalid Transaction
@pytest.mark.asyncio
async def test_approve_borrow_invalid_transaction(validation_client: AsyncClient):
    """Test approving borrow with invalid transaction ID"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = await validation_client.post(
        "/admin/transactions/507f1f77bcf86cd799439011/approve-borrow",
        headers=admin_headers
    )
    assert response.status_code == 404

# 29. Test Approve Borrow Already Approved
@pytest.mark.asyncio
async def test_approve_borrow_already_approved(validation_client: AsyncClient):
    """Test approving borrow that's already approved"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "already_user", "already@test.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book and borrow
    book = await validation_client.post("/books/", json={
        "title": "Already Book",
        "author": "Author",
        "isbn": "ISBN222",
        "quantity": 1
    }, headers=admin_headers)
    book_id = book.json()["id"]
    
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    borrow_response = await validation_client.post("/transactions/borrow", json={
        "user_id": user_id,
        "book_id": book_id
    }, headers=user_headers)
    transaction_id = borrow_response.json()["id"]
    
    # Approve first time
    await validation_client.post(
        f"/admin/transactions/{transaction_id}/approve-borrow",
        headers=admin_headers
    )
    
    # Try to approve again
    response = await validation_client.post(
        f"/admin/transactions/{transaction_id}/approve-borrow",
        headers=admin_headers
    )
    assert response.status_code == 400
    assert "not pending" in response.json()["detail"].lower()

# 30. Test Borrow Same Book Twice
@pytest.mark.asyncio
async def test_borrow_same_book_twice(validation_client: AsyncClient):
    """Test that user cannot borrow same book twice"""
    admin_token = await get_admin_token(validation_client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    user_token = await get_user_token(validation_client, "twice_user", "twice@test.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create book
    book = await validation_client.post("/books/", json={
        "title": "Twice Book",
        "author": "Author",
        "isbn": "ISBN111",
        "quantity": 2
    }, headers=admin_headers)
    book_id = book.json()["id"]
    
    user_info = await validation_client.get("/auth/me", headers=user_headers)
    user_id = user_info.json()["id"]
    
    # Borrow first time
    await validation_client.post("/transactions/borrow", json={
        "user_id": user_id,
        "book_id": book_id
    }, headers=user_headers)
    
    # Try to borrow again
    response = await validation_client.post("/transactions/borrow", json={
        "user_id": user_id,
        "book_id": book_id
    }, headers=user_headers)
    assert response.status_code == 400
    assert "already have" in response.json()["detail"].lower()
