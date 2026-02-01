import pytest
from httpx import AsyncClient

# 1. Create User (Success)
@pytest.mark.asyncio
async def test_create_user(validation_client: AsyncClient):
    payload = {"username": "testuser", "email": "test@example.com"}
    response = await validation_client.post("/users/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data

# 2. Create Book (Success)
@pytest.mark.asyncio
async def test_create_book(validation_client: AsyncClient):
    payload = {"title": "Test Book", "author": "Author One", "isbn": "1234567890", "quantity": 5}
    response = await validation_client.post("/books/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Book"
    assert data["quantity"] == 5

# 3. Get Book List
@pytest.mark.asyncio
async def test_get_books(validation_client: AsyncClient):
    # Create a book first
    await validation_client.post("/books/", json={"title": "B1", "author": "A1", "isbn": "111", "quantity": 1})
    
    response = await validation_client.get("/books/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

# 4. Borrow Book (Success)
@pytest.mark.asyncio
async def test_borrow_book_success(validation_client: AsyncClient):
    # Setup
    user = await validation_client.post("/users/", json={"username": "u1", "email": "e1"})
    book = await validation_client.post("/books/", json={"title": "b1", "author": "a1", "isbn": "222", "quantity": 1})
    user_id = user.json()["id"]
    book_id = book.json()["id"]

    # Action
    response = await validation_client.post("/transactions/borrow", json={"user_id": user_id, "book_id": book_id})
    assert response.status_code == 200
    assert response.json()["status"] == "Borrowed"

    # Verify Quantity Decreased
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 0

# 5. Borrow Book (Fail - Out of stock)
@pytest.mark.asyncio
async def test_borrow_book_out_of_stock(validation_client: AsyncClient):
    # Setup
    user = await validation_client.post("/users/", json={"username": "u2", "email": "e2"})
    book = await validation_client.post("/books/", json={"title": "b2", "author": "a2", "isbn": "333", "quantity": 0})
    user_id = user.json()["id"]
    book_id = book.json()["id"]

    # Action
    response = await validation_client.post("/transactions/borrow", json={"user_id": user_id, "book_id": book_id})
    assert response.status_code == 400
    assert response.json()["detail"] == "Book out of stock"

# 6. Return Book (Success)
@pytest.mark.asyncio
async def test_return_book_success(validation_client: AsyncClient):
    # Setup: Borrow
    user = await validation_client.post("/users/", json={"username": "u3", "email": "e3"})
    book = await validation_client.post("/books/", json={"title": "b4", "author": "a4", "isbn": "555", "quantity": 1})
    user_id = user.json()["id"]
    book_id = book.json()["id"]
    await validation_client.post("/transactions/borrow", json={"user_id": user_id, "book_id": book_id})

    # Action: Return
    response = await validation_client.post("/transactions/return", json={"user_id": user_id, "book_id": book_id})
    assert response.status_code == 200
    assert response.json()["status"] == "Returned"

    # Verify Quantity Increased
    book_check = await validation_client.get(f"/books/{book_id}")
    assert book_check.json()["quantity"] == 1

# 7. Return Book (Fail - Transaction not found)
@pytest.mark.asyncio
async def test_return_book_no_transaction(validation_client: AsyncClient):
    user = await validation_client.post("/users/", json={"username": "u4", "email": "e4"})
    book = await validation_client.post("/books/", json={"title": "b5", "author": "a5", "isbn": "666", "quantity": 1})
    
    response = await validation_client.post("/transactions/return", json={"user_id": user.json()["id"], "book_id": book.json()["id"]})
    assert response.status_code == 404

# 8. Get User Borrow History
@pytest.mark.asyncio
async def test_get_user_history(validation_client: AsyncClient):
    user = await validation_client.post("/users/", json={"username": "u6", "email": "e6"})
    book = await validation_client.post("/books/", json={"title": "b7", "author": "a7", "isbn": "888", "quantity": 1})
    uid, bid = user.json()["id"], book.json()["id"]
    
    await validation_client.post("/transactions/borrow", json={"user_id": uid, "book_id": bid})
    
    response = await validation_client.get(f"/transactions/user/{uid}")
    assert response.status_code == 200
    assert len(response.json()) == 1

# 9. Delete Book
@pytest.mark.asyncio
async def test_delete_book(validation_client: AsyncClient):
    book = await validation_client.post("/books/", json={"title": "b8", "author": "a8", "isbn": "999", "quantity": 1})
    bid = book.json()["id"]
    
    response = await validation_client.delete(f"/books/{bid}")
    assert response.status_code == 200
    
    check = await validation_client.get(f"/books/{bid}")
    assert check.status_code == 404

# 10. Check ISBN Uniqueness
@pytest.mark.asyncio
async def test_isbn_uniqueness(validation_client: AsyncClient):
    await validation_client.post("/books/", json={"title": "b9", "author": "a9", "isbn": "000", "quantity": 1})
    
    response = await validation_client.post("/books/", json={"title": "b10", "author": "a10", "isbn": "000", "quantity": 1})
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
