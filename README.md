# ระบบยืม-คืนหนังสือ (Library Management System)

ระบบจัดการการยืม-คืนหนังสือที่พัฒนาด้วย FastAPI และ MongoDB

## เทคโนโลยีที่ใช้

### Backend
- **Framework**: FastAPI
- **Database**: MongoDB 6.0
- **ODM**: Beanie
- **Testing**: Pytest (10 test cases)
- **Containerization**: Docker & Docker Compose

### Frontend
- **Framework**: Expo (React Native)
- **Navigation**: React Navigation
- **HTTP Client**: Axios

## โครงสร้างโปรเจกต์

```
.
├── backend/                 # Backend (FastAPI)
│   ├── app/
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── database.py      # Database connection และ initialization
│   │   ├── models.py        # MongoDB models (Book, User, Transaction)
│   │   ├── schemas.py       # Pydantic schemas สำหรับ request/response
│   │   └── routers/
│   │       ├── books.py     # API endpoints สำหรับจัดการหนังสือ
│   │       ├── users.py     # API endpoints สำหรับจัดการผู้ใช้
│   │       └── transactions.py # API endpoints สำหรับการยืม-คืนหนังสือ
│   ├── tests/               # Backend tests
│   │   ├── conftest.py      # Pytest configuration และ fixtures
│   │   └── test_api.py      # Unit tests (10 test cases)
│   ├── Dockerfile           # Docker image definition
│   ├── requirements.txt     # Python dependencies
│   ├── pytest.ini           # Pytest configuration
│   └── run_tests_docker.*   # Test scripts
├── frontend/                # Frontend (Expo)
│   ├── src/
│   │   ├── config/          # API configuration
│   │   ├── services/        # API service functions
│   │   └── screens/         # App screens
│   └── App.js               # Main app component
└── docker-compose.yml       # Docker Compose configuration

```

## การติดตั้งและรันระบบ

### ข้อกำหนดเบื้องต้น

- Docker และ Docker Compose
- Python 3.10+ (สำหรับรัน tests โดยตรง)

### การรันด้วย Docker (แนะนำ)

1. **Build และรัน containers:**
   ```bash
   docker-compose up --build
   ```

2. **ตรวจสอบว่าระบบทำงาน:**
   - API จะรันที่ `http://localhost:8000`
   - MongoDB จะรันที่ `localhost:27017`
   - API Documentation: `http://localhost:8000/docs`

3. **หยุดระบบ:**
   ```bash
   docker-compose down
   ```

4. **หยุดและลบ volumes:**
   ```bash
   docker-compose down -v
   ```

### การรัน Tests

#### วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)

**Windows:**
```powershell
# PowerShell
cd backend
.\run_tests_docker.ps1

# หรือ Command Prompt
cd backend
run_tests_docker.bat
```

#### วิธีที่ 2: รัน tests ด้วย Docker

```bash
# รัน tests ใน container
docker-compose exec backend pytest tests/ -v

# หรือรัน tests พร้อม coverage
docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing

# รัน test case เฉพาะ
docker-compose exec backend pytest tests/test_api.py::test_create_user -v
```

**หรือใช้ Script อัตโนมัติ:**
```bash
# Windows PowerShell
cd backend
.\run_tests_docker.ps1

# Windows Command Prompt
cd backend
run_tests_docker.bat
```

#### วิธีที่ 3: รัน tests โดยตรง (ต้องมี MongoDB รันอยู่)

1. **ติดตั้ง dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **รัน MongoDB (หรือใช้ Docker):**
   ```bash
   docker-compose up db -d
   ```

3. **รัน tests:**
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

## Test Cases

ระบบมี **10 test cases** ที่ครอบคลุม:

1. ✅ Create User (Success)
2. ✅ Create Book (Success)
3. ✅ Get Book List
4. ✅ Borrow Book (Success)
5. ✅ Borrow Book (Fail - Out of stock)
6. ✅ Return Book (Success)
7. ✅ Return Book (Fail - Transaction not found)
8. ✅ Get User Borrow History
9. ✅ Delete Book
10. ✅ Check ISBN Uniqueness

## Frontend (Expo)

### การรัน Frontend

1. **ติดตั้ง dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **รัน Backend ก่อน:**
   ```bash
   docker-compose up -d
   ```

3. **รัน Frontend:**

   **Web Browser:**
   ```bash
   npm run web
   ```

   **Mobile (Expo Go):**
   ```bash
   npm start
   ```
   แล้วสแกน QR Code ด้วย Expo Go app

### การเชื่อมต่อ Frontend กับ Backend

- **Web Browser**: เชื่อมต่ออัตโนมัติที่ `http://localhost:8000`
- **Mobile (Expo Go)**: แก้ไข `src/config/api.js` ให้ใช้ IP address ของเครื่อง

**ดูรายละเอียดเพิ่มเติม:** [frontend/README.md](frontend/README.md)

## ตัวอย่างการใช้งาน API

### สร้างผู้ใช้
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "email": "john@example.com"}'
```

### สร้างหนังสือ
```bash
curl -X POST "http://localhost:8000/books/" \
  -H "Content-Type: application/json" \
  -d '{"title": "Python Programming", "author": "John Smith", "isbn": "9780123456789", "quantity": 5}'
```

### ยืมหนังสือ
```bash
curl -X POST "http://localhost:8000/transactions/borrow" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_ID", "book_id": "BOOK_ID"}'
```

### คืนหนังสือ
```bash
curl -X POST "http://localhost:8000/transactions/return" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_ID", "book_id": "BOOK_ID"}'
```

## Environment Variables

- `MONGODB_URL`: MongoDB connection string (default: `mongodb://localhost:27017/library_db`)

## หมายเหตุ

- ระบบใช้ MongoDB เป็น database
- Tests ใช้ database แยก (`test_library_db`) เพื่อไม่ให้กระทบข้อมูลจริง
- Docker Compose มี healthcheck สำหรับ MongoDB เพื่อให้แน่ใจว่า database พร้อมก่อนรัน backend
