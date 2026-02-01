# ER-Diagram: ระบบยืม-คืนหนังสือ

## Mermaid ER-Diagram (Crow's Foot Notation)

```mermaid
erDiagram
    USER ||--o{ TRANSACTION : "borrows"
    BOOK ||--o{ TRANSACTION : "has"
    
    USER {
        ObjectId id PK
        string username UK "unique, indexed"
        string email UK "unique, indexed"
        string password
        string role "user | admin"
        datetime created_at
    }
    
    BOOK {
        ObjectId id PK
        string title
        string author
        string isbn UK "unique, indexed"
        int quantity
        string image_url "optional"
    }
    
    TRANSACTION {
        ObjectId id PK
        string user_id FK
        string book_id FK
        datetime borrow_date
        datetime return_date "optional"
        string status "Pending | Borrowed | PendingReturn | Returned"
    }
```

## ความสัมพันธ์

- **USER → TRANSACTION (1:N)**: ผู้ใช้หนึ่งคนสามารถยืม-คืนหนังสือได้หลายครั้ง
- **BOOK → TRANSACTION (1:N)**: หนังสือหนึ่งเล่มสามารถถูกยืมได้หลายครั้ง

## Constraints

- `username` และ `email` ใน USER ต้องไม่ซ้ำกัน
- `isbn` ใน BOOK ต้องไม่ซ้ำกัน
- `user_id` ใน TRANSACTION ต้องอ้างอิงถึง USER ที่มีอยู่จริง
- `book_id` ใน TRANSACTION ต้องอ้างอิงถึง BOOK ที่มีอยู่จริง
