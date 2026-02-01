# Backend - Library Management System

Backend API สำหรับระบบยืม-คืนหนังสือที่พัฒนาด้วย FastAPI และ MongoDB

## เทคโนโลยีที่ใช้

- **Framework**: FastAPI
- **Database**: MongoDB 6.0
- **ODM**: Beanie
- **Testing**: Pytest (10 test cases)
- **Containerization**: Docker & Docker Compose

## โครงสร้าง

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database connection และ initialization
│   ├── models.py            # MongoDB models (Book, User, Transaction)
│   ├── schemas.py           # Pydantic schemas สำหรับ request/response
│   └── routers/
│       ├── books.py         # API endpoints สำหรับจัดการหนังสือ
│       ├── users.py         # API endpoints สำหรับจัดการผู้ใช้
│       └── transactions.py  # API endpoints สำหรับการยืม-คืนหนังสือ
├── tests/
│   ├── conftest.py          # Pytest configuration และ fixtures
│   └── test_api.py          # Unit tests (10 test cases)
├── Dockerfile               # Docker image definition
├── requirements.txt         # Python dependencies
└── pytest.ini               # Pytest configuration
```

## การรัน

### ด้วย Docker (แนะนำ)

จาก root directory ของโปรเจกต์:

```bash
docker-compose up --build
```

API จะรันที่ `http://localhost:8000`

### โดยตรง (Development)

1. **ติดตั้ง dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **รัน MongoDB:**
   ```bash
   docker-compose up db -d
   ```

3. **รัน FastAPI:**
   ```bash
   uvicorn app.main:app --reload
   ```

## การรัน Tests

### ด้วย Docker

```bash
# จาก root directory
docker-compose exec backend pytest tests/ -v

# หรือใช้ script
cd backend
.\run_tests_docker.ps1  # Windows PowerShell
run_tests_docker.bat    # Windows Command Prompt
```

### โดยตรง

```bash
cd backend
pytest tests/ -v
```

## API Endpoints

### Books (หนังสือ)

- `GET /books/` - ดึงรายการหนังสือทั้งหมด
- `GET /books/{id}` - ดึงข้อมูลหนังสือตาม ID
- `POST /books/` - สร้างหนังสือใหม่
- `PUT /books/{id}` - อัปเดตข้อมูลหนังสือ
- `DELETE /books/{id}` - ลบหนังสือ

### Users (ผู้ใช้)

- `POST /users/` - สร้างผู้ใช้ใหม่
- `GET /users/{id}` - ดึงข้อมูลผู้ใช้ตาม ID

### Transactions (การยืม-คืน)

- `POST /transactions/borrow` - ยืมหนังสือ
- `POST /transactions/return` - คืนหนังสือ
- `GET /transactions/user/{user_id}` - ดูประวัติการยืม-คืนของผู้ใช้

## API Documentation

เมื่อรัน Backend แล้ว สามารถเข้าดู API Documentation ได้ที่:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
