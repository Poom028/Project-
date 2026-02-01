# ER-Diagram: ระบบยืม-คืนหนังสือ (Library Management System)

## ข้อมูล Entity และ Attributes

### 1. User (ผู้ใช้)
- **Primary Key:** id
- **Attributes:**
  - id (ObjectId)
  - username (String, Unique, Indexed)
  - email (String, Unique, Indexed)
  - password (String - Hashed)
  - role (String: "user" | "admin")
  - created_at (DateTime)

### 2. Book (หนังสือ)
- **Primary Key:** id
- **Attributes:**
  - id (ObjectId)
  - title (String)
  - author (String)
  - isbn (String, Unique, Indexed)
  - quantity (Integer)
  - image_url (String, Optional)

### 3. Transaction (การยืม-คืน)
- **Primary Key:** id
- **Foreign Keys:**
  - user_id (String → User.id)
  - book_id (String → Book.id)
- **Attributes:**
  - id (ObjectId)
  - user_id (String)
  - book_id (String)
  - borrow_date (DateTime)
  - return_date (DateTime, Optional)
  - status (String: "Pending" | "Borrowed" | "PendingReturn" | "Returned")

---

## ความสัมพันธ์ (Relationships)

### 1. User → Transaction
- **Type:** One-to-Many (1:N)
- **Description:** ผู้ใช้หนึ่งคนสามารถยืม-คืนหนังสือได้หลายครั้ง
- **Cardinality:** One User can have Many Transactions

### 2. Book → Transaction
- **Type:** One-to-Many (1:N)
- **Description:** หนังสือหนึ่งเล่มสามารถถูกยืมได้หลายครั้ง
- **Cardinality:** One Book can have Many Transactions

---

## ER-Diagram: Chen Notation

```
┌─────────────────────────────────────────────────────────────┐
│                        ER-DIAGRAM                            │
│                    (Chen Notation)                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐                    ┌──────────────┐
│     USER     │                    │     BOOK    │
├──────────────┤                    ├──────────────┤
│ id (PK)      │                    │ id (PK)      │
│ username     │                    │ title        │
│ email        │                    │ author       │
│ password     │                    │ isbn (UK)    │
│ role         │                    │ quantity     │
│ created_at   │                    │ image_url    │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │                                   │
       │         ┌──────────────┐          │
       │         │  BORROWS     │          │
       │         │  (Relationship)         │
       │         └──────┬───────┘          │
       │                │                  │
       │                │                  │
       └────────────────┼──────────────────┘
                        │
                        │
                ┌───────▼────────┐
                │  TRANSACTION   │
                ├────────────────┤
                │ id (PK)        │
                │ user_id (FK)   │
                │ book_id (FK)   │
                │ borrow_date    │
                │ return_date    │
                │ status         │
                └────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
UK = Unique Key
```

---

## ER-Diagram: Crow's Foot Notation

```
┌─────────────────────────────────────────────────────────────┐
│                    ER-DIAGRAM                               │
│              (Crow's Foot Notation)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│              USER                   │
├─────────────────────────────────────┤
│ PK │ id                             │
│    │ username (UNIQUE)              │
│    │ email (UNIQUE)                 │
│    │ password                       │
│    │ role                           │
│    │ created_at                     │
└────┼───────────────────────────────┘
     │
     │ 1
     │
     │
     │ N
     │
┌────▼───────────────────────────────┐
│         TRANSACTION                │
├─────────────────────────────────────┤
│ PK │ id                             │
│ FK │ user_id ────────┐              │
│ FK │ book_id ────────┼──┐           │
│    │ borrow_date     │  │           │
│    │ return_date     │  │           │
│    │ status          │  │           │
└────┼─────────────────┘  │          │
     │                     │          │
     │ N                   │          │
     │                     │          │
     │ 1                   │          │
     │                     │          │
┌────┼─────────────────────┼──────────┘
│    │              BOOK   │
├────┼─────────────────────┤
│ PK │ id                  │
│    │ title               │
│    │ author              │
│ UK │ isbn                │
│    │ quantity            │
│    │ image_url           │
└────┴─────────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
UK = Unique Key
1 = One
N = Many
```

---

## รายละเอียดความสัมพันธ์

### Relationship: User BORROWS Transaction
- **Type:** One-to-Many (1:N)
- **User Side:** One (1) - ผู้ใช้หนึ่งคน
- **Transaction Side:** Many (N) - การยืม-คืนหลายครั้ง
- **Business Rule:**
  - ผู้ใช้หนึ่งคนสามารถยืมหนังสือได้หลายเล่ม
  - ผู้ใช้หนึ่งคนสามารถยืมหนังสือเล่มเดียวกันได้หลายครั้ง (แต่ต้องคืนก่อน)
  - แต่ละ Transaction ต้องมี User เพียงคนเดียว

### Relationship: Book HAS Transaction
- **Type:** One-to-Many (1:N)
- **Book Side:** One (1) - หนังสือหนึ่งเล่ม
- **Transaction Side:** Many (N) - การยืม-คืนหลายครั้ง
- **Business Rule:**
  - หนังสือหนึ่งเล่มสามารถถูกยืมได้หลายครั้ง
  - หนังสือหนึ่งเล่มสามารถถูกยืมโดยผู้ใช้หลายคน (แต่ไม่พร้อมกัน)
  - แต่ละ Transaction ต้องมี Book เพียงเล่มเดียว

---

## Constraints และ Business Rules

### 1. User Constraints
- `username` ต้องไม่ซ้ำกัน (UNIQUE)
- `email` ต้องไม่ซ้ำกัน (UNIQUE)
- `role` ต้องเป็น "user" หรือ "admin" เท่านั้น

### 2. Book Constraints
- `isbn` ต้องไม่ซ้ำกัน (UNIQUE)
- `quantity` ต้องเป็นจำนวนเต็มบวกหรือศูนย์

### 3. Transaction Constraints
- `user_id` ต้องอ้างอิงถึง User ที่มีอยู่จริง
- `book_id` ต้องอ้างอิงถึง Book ที่มีอยู่จริง
- `status` ต้องเป็นหนึ่งใน: "Pending", "Borrowed", "PendingReturn", "Returned"
- `borrow_date` ต้องมีค่าเสมอ
- `return_date` เป็น NULL เมื่อยังไม่คืนหนังสือ

### 4. Business Rules
- ผู้ใช้ไม่สามารถยืมหนังสือที่ `quantity = 0` ได้
- ผู้ใช้ไม่สามารถยืมหนังสือเล่มเดียวกันได้ถ้ายังมี Transaction ที่ status เป็น "Pending" หรือ "Borrowed"
- การยืมหนังสือต้องผ่านการอนุมัติจาก Admin (status เริ่มต้นเป็น "Pending")
- การคืนหนังสือต้องผ่านการอนุมัติจาก Admin (status เปลี่ยนเป็น "PendingReturn" ก่อน)

---

## Database Schema (MongoDB Collections)

### Collection: users
```json
{
  "_id": ObjectId,
  "username": String (unique, indexed),
  "email": String (unique, indexed),
  "password": String,
  "role": String,
  "created_at": DateTime
}
```

### Collection: books
```json
{
  "_id": ObjectId,
  "title": String,
  "author": String,
  "isbn": String (unique, indexed),
  "quantity": Integer,
  "image_url": String (optional)
}
```

### Collection: transactions
```json
{
  "_id": ObjectId,
  "user_id": String,
  "book_id": String,
  "borrow_date": DateTime,
  "return_date": DateTime (optional),
  "status": String
}
```

---

## สรุป

ระบบยืม-คืนหนังสือมี **3 Entities** และ **2 Relationships**:

1. **Entities:**
   - User (ผู้ใช้)
   - Book (หนังสือ)
   - Transaction (การยืม-คืน)

2. **Relationships:**
   - User → Transaction (1:N)
   - Book → Transaction (1:N)

3. **Cardinality:**
   - User กับ Transaction: One-to-Many
   - Book กับ Transaction: One-to-Many

4. **Notation:**
   - Chen Notation: ใช้รูปสี่เหลี่ยมสำหรับ Entity และรูปเพชรสำหรับ Relationship
   - Crow's Foot Notation: ใช้เส้นและสัญลักษณ์ Crow's Foot แสดงความสัมพันธ์
