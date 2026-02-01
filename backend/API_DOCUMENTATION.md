# API Documentation - Library Management System

## Base URL
```
http://localhost:8000
```

## Authentication

### Register (User)
```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "user"  // Optional, defaults to "user"
}
```

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "user",
  "created_at": "2024-01-01T00:00:00"
}
```

### Register (Admin)
```http
POST /auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "string",
  "role": "admin"
}
```

### Login
```http
POST /auth/login-json
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "user",
  "created_at": "2024-01-01T00:00:00"
}
```

---

## Books API

### Get All Books (Public)
```http
GET /books/
```

**Response:**
```json
[
  {
    "id": "string",
    "title": "string",
    "author": "string",
    "isbn": "string",
    "quantity": 0
  }
]
```

### Get Book by ID (Public)
```http
GET /books/{id}
```

### Create Book (Admin Only)
```http
POST /books/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "string",
  "author": "string",
  "isbn": "string",
  "quantity": 0
}
```

### Update Book (Admin Only)
```http
PUT /books/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "string",  // Optional
  "author": "string",  // Optional
  "quantity": 0  // Optional
}
```

### Delete Book (Admin Only)
```http
DELETE /books/{id}
Authorization: Bearer {admin_token}
```

---

## Transactions API

### Borrow Book
```http
POST /transactions/borrow
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "string",
  "book_id": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "user_id": "string",
  "book_id": "string",
  "borrow_date": "2024-01-01T00:00:00",
  "return_date": null,
  "status": "Borrowed"
}
```

### Return Book
```http
POST /transactions/return
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "string",
  "book_id": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "user_id": "string",
  "book_id": "string",
  "borrow_date": "2024-01-01T00:00:00",
  "return_date": "2024-01-02T00:00:00",
  "status": "Returned"
}
```

### Get User History
```http
GET /transactions/user/{user_id}
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "string",
    "user_id": "string",
    "book_id": "string",
    "borrow_date": "2024-01-01T00:00:00",
    "return_date": "2024-01-02T00:00:00",
    "status": "Returned"
  }
]
```

---

## Admin API

**All admin endpoints require admin role and Bearer token**

### Get All Users
```http
GET /admin/users
Authorization: Bearer {admin_token}
```

### Get User by ID
```http
GET /admin/users/{user_id}
Authorization: Bearer {admin_token}
```

### Update User Role
```http
PUT /admin/users/{user_id}/role?new_role=admin
Authorization: Bearer {admin_token}
```

### Delete User
```http
DELETE /admin/users/{user_id}
Authorization: Bearer {admin_token}
```

### Get System Statistics
```http
GET /admin/stats
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "total_users": 10,
  "total_admins": 1,
  "total_regular_users": 9,
  "total_books": 50,
  "total_transactions": 100,
  "active_borrows": 5,
  "returned_books": 95
}
```

### Get All Transactions
```http
GET /admin/transactions
Authorization: Bearer {admin_token}
```

### Get Transaction by ID
```http
GET /admin/transactions/{transaction_id}
Authorization: Bearer {admin_token}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions. Admin access required."
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

---

## Summary

### ✅ Authentication
- ✅ Register (User & Admin)
- ✅ Login (User & Admin)
- ✅ Get Current User Info

### ✅ Books CRUD
- ✅ Get All Books (Public)
- ✅ Get Book by ID (Public)
- ✅ Create Book (Admin Only)
- ✅ Update Book (Admin Only)
- ✅ Delete Book (Admin Only)

### ✅ Borrow / Return
- ✅ Borrow Book
- ✅ Return Book

### ✅ History
- ✅ Get User History

### ✅ Admin Features
- ✅ User Management (List, Get, Update Role, Delete)
- ✅ System Statistics
- ✅ Transaction Management (List, Get)
