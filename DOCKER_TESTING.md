# คู่มือการรัน Tests ด้วย Docker

## วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)

### Windows PowerShell:
```powershell
.\run_tests_docker.ps1
```

### Windows Command Prompt:
```cmd
run_tests_docker.bat
```

สคริปต์จะถามว่าต้องการรันแบบไหน:
- รัน tests ทั้งหมด
- รันพร้อม coverage
- รัน test case เฉพาะ
- รันแบบ verbose
- ดูรายการ test cases

---

## วิธีที่ 2: รันด้วยคำสั่ง Docker โดยตรง

### 1. เริ่ม Docker Containers

```bash
# Build และรัน containers
docker-compose up -d

# ตรวจสอบว่า containers รันอยู่
docker-compose ps
```

### 2. รัน Tests

```bash
# รัน tests ทั้งหมด (12 test cases)
docker-compose exec backend pytest tests/ -v

# รัน tests พร้อม coverage
docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing

# รัน tests แบบ verbose (แสดง output ทั้งหมด)
docker-compose exec backend pytest tests/ -v -s

# รัน test case เฉพาะ
docker-compose exec backend pytest tests/test_api.py::test_create_user -v

# ดูรายการ test cases ทั้งหมด
docker-compose exec backend pytest tests/ --collect-only
```

---

## คำสั่งที่มีประโยชน์

### ตรวจสอบสถานะ Containers
```bash
docker-compose ps
```

### ดู Logs
```bash
# ดู logs ของ backend
docker-compose logs backend

# ดู logs ของ MongoDB
docker-compose logs db

# ดู logs แบบ real-time
docker-compose logs -f backend
```

### เข้าไปใน Container
```bash
# เข้าไปใน backend container
docker-compose exec backend bash

# จากนั้นรัน tests ได้โดยตรง
pytest tests/ -v
```

### Restart Containers
```bash
# Restart containers
docker-compose restart

# Restart เฉพาะ backend
docker-compose restart backend
```

### Stop และ Cleanup
```bash
# หยุด containers
docker-compose down

# หยุดและลบ volumes (ลบข้อมูล MongoDB)
docker-compose down -v
```

---

## Test Cases ทั้งหมด (12 Cases)

เมื่อรัน tests จะได้ผลลัพธ์ประมาณนี้:

```
tests/test_api.py::test_create_user PASSED
tests/test_api.py::test_create_book PASSED
tests/test_api.py::test_get_books PASSED
tests/test_api.py::test_borrow_book_success PASSED
tests/test_api.py::test_borrow_book_out_of_stock PASSED
tests/test_api.py::test_borrow_book_user_not_found PASSED
tests/test_api.py::test_return_book_success PASSED
tests/test_api.py::test_return_book_no_transaction PASSED
tests/test_api.py::test_return_book_already_returned PASSED
tests/test_api.py::test_get_user_history PASSED
tests/test_api.py::test_delete_book PASSED
tests/test_api.py::test_isbn_uniqueness PASSED

======================== 12 passed in X.XXs ========================
```

---

## แก้ไขปัญหา

### ปัญหา: Container ไม่รัน

**วิธีแก้:**
```bash
# ตรวจสอบ logs
docker-compose logs

# Build ใหม่
docker-compose up --build -d
```

### ปัญหา: MongoDB connection error

**วิธีแก้:**
```bash
# ตรวจสอบว่า MongoDB container รันอยู่
docker-compose ps db

# ตรวจสอบ MongoDB logs
docker-compose logs db

# Restart MongoDB
docker-compose restart db
```

### ปัญหา: Tests fail เพราะ database

**วิธีแก้:**
- Tests ใช้ database แยก (`test_library_db`) ไม่กระทบข้อมูลจริง
- ถ้ายังมีปัญหา ลอง restart containers:
```bash
docker-compose down
docker-compose up -d
```

### ปัญหา: Permission denied

**วิธีแก้:**
```bash
# บน Linux/Mac อาจต้องใช้ sudo
sudo docker-compose exec backend pytest tests/ -v

# หรือแก้ไข permissions
sudo chown -R $USER:$USER .
```

---

## Environment Variables

Tests จะใช้ MongoDB ตาม environment variable:
- `TEST_MONGODB_HOST`: MongoDB host (default: `localhost`)
  - ถ้ารันใน Docker: ใช้ `db` (ชื่อ service)
  - ถ้ารันโดยตรง: ใช้ `localhost`

---

## ตัวอย่างการใช้งาน

### รัน tests ทั้งหมด
```bash
docker-compose exec backend pytest tests/ -v
```

### รัน tests พร้อม coverage
```bash
docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing
```

### รัน test case เฉพาะ
```bash
docker-compose exec backend pytest tests/test_api.py::test_create_user -v
```

### รัน tests ที่เกี่ยวข้องกับ "borrow"
```bash
docker-compose exec backend pytest tests/ -v -k "borrow"
```

### รัน tests และหยุดเมื่อพบ error แรก
```bash
docker-compose exec backend pytest tests/ -v -x
```

---

## Tips

1. **ใช้ volume mount**: โค้ดจะ sync อัตโนมัติ (ไม่ต้อง rebuild)
2. **ใช้ test database แยก**: ไม่กระทบข้อมูลจริง
3. **ตรวจสอบ logs**: ใช้ `docker-compose logs` เพื่อ debug
4. **Restart เมื่อมีปัญหา**: `docker-compose restart`
