# คู่มือการรัน Tests

## วิธีที่ 1: รัน Tests ด้วย Docker (แนะนำ)

### ข้อกำหนดเบื้องต้น
- Docker และ Docker Compose ทำงานได้
- MongoDB container รันอยู่

### ขั้นตอนการรัน

1. **รัน Docker containers:**
   ```bash
   docker-compose up -d
   ```

2. **รัน tests ใน container:**
   ```bash
   docker-compose exec backend pytest tests/ -v
   ```

3. **รัน tests พร้อมแสดงผลละเอียด:**
   ```bash
   docker-compose exec backend pytest tests/ -v -s
   ```

4. **รัน tests พร้อม coverage:**
   ```bash
   docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing
   ```

5. **รัน test case เฉพาะ:**
   ```bash
   docker-compose exec backend pytest tests/test_api.py::test_create_user -v
   ```

---

## วิธีที่ 2: รัน Tests โดยตรง (ไม่ใช้ Docker)

### ข้อกำหนดเบื้องต้น
- Python 3.10+ ติดตั้งแล้ว
- MongoDB รันอยู่ที่ `localhost:27017` (หรือใช้ Docker แค่ MongoDB)

### ขั้นตอนการรัน

#### 1. ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

#### 2. รัน MongoDB (ถ้ายังไม่มี)

**ตัวเลือก A: ใช้ Docker แค่ MongoDB**
```bash
# รันแค่ MongoDB container
docker-compose up db -d

# ตรวจสอบว่า MongoDB รันอยู่
docker-compose ps
```

**ตัวเลือก B: ติดตั้ง MongoDB โดยตรง**
- ดาวน์โหลดและติดตั้ง MongoDB Community Edition
- รัน MongoDB service

#### 3. รัน Tests

```bash
# รัน tests ทั้งหมด
pytest tests/ -v

# รัน tests พร้อมแสดงผลละเอียด
pytest tests/ -v -s

# รัน tests พร้อม coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# รัน test case เฉพาะ
pytest tests/test_api.py::test_create_user -v
```

---

## วิธีที่ 3: รัน Tests แบบ Interactive (สำหรับ Debug)

### ใช้ pytest with breakpoint

```bash
# รัน tests และหยุดที่ breakpoint
pytest tests/ -v -s --pdb
```

### ใช้ VS Code Debugger

1. สร้างไฟล์ `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Pytest",
            "type": "python",
            "request": "launch",
            "module": "pytest",
            "args": [
                "tests/",
                "-v",
                "-s"
            ],
            "console": "integratedTerminal",
            "justMyCode": false
        }
    ]
}
```

2. กด F5 เพื่อเริ่ม debug

---

## Test Cases ทั้งหมด (12 Cases)

ระบบมี **12 test cases** ที่ครอบคลุม:

1. ✅ `test_create_user` - สร้างผู้ใช้สำเร็จ
2. ✅ `test_create_book` - สร้างหนังสือสำเร็จ
3. ✅ `test_get_books` - ดึงรายการหนังสือ
4. ✅ `test_borrow_book_success` - ยืมหนังสือสำเร็จ
5. ✅ `test_borrow_book_out_of_stock` - ยืมหนังสือล้มเหลว (หนังสือหมด)
6. ✅ `test_borrow_book_user_not_found` - ยืมหนังสือล้มเหลว (ไม่พบผู้ใช้)
7. ✅ `test_return_book_success` - คืนหนังสือสำเร็จ
8. ✅ `test_return_book_no_transaction` - คืนหนังสือล้มเหลว (ไม่พบ transaction)
9. ✅ `test_return_book_already_returned` - คืนหนังสือล้มเหลว (คืนแล้ว)
10. ✅ `test_get_user_history` - ดึงประวัติการยืม-คืนของผู้ใช้
11. ✅ `test_delete_book` - ลบหนังสือ
12. ✅ `test_isbn_uniqueness` - ตรวจสอบความ unique ของ ISBN

---

## คำสั่งที่มีประโยชน์

### ดูรายการ test cases ทั้งหมด
```bash
pytest tests/ --collect-only
```

### รัน tests แบบ parallel (เร็วขึ้น)
```bash
pip install pytest-xdist
pytest tests/ -v -n auto
```

### รัน tests และสร้าง HTML report
```bash
pip install pytest-html
pytest tests/ -v --html=report.html --self-contained-html
```

### รัน tests เฉพาะที่ fail
```bash
pytest tests/ -v --lf
```

### รัน tests และหยุดเมื่อพบ error แรก
```bash
pytest tests/ -v -x
```

---

## ตรวจสอบผลลัพธ์

### ผลลัพธ์ที่คาดหวัง

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

### ปัญหา: MongoDB connection error

**วิธีแก้:**
```bash
# ตรวจสอบว่า MongoDB รันอยู่
docker-compose ps

# หรือถ้าใช้ MongoDB โดยตรง
# ตรวจสอบว่า MongoDB service รันอยู่
```

### ปัญหา: Module not found

**วิธีแก้:**
```bash
# ติดตั้ง dependencies ใหม่
pip install -r requirements.txt

# หรือใน Docker
docker-compose exec backend pip install -r requirements.txt
```

### ปัญหา: Tests fail เพราะ database

**วิธีแก้:**
- Tests ใช้ database แยก (`test_library_db`) ไม่กระทบข้อมูลจริง
- แต่ถ้ายังมีปัญหา ลองลบ database:
```bash
# ใน MongoDB shell หรือใช้ MongoDB Compass
use test_library_db
db.dropDatabase()
```

---

## ตัวอย่างการรัน

### รัน tests แบบง่าย
```bash
pytest tests/ -v
```

### รัน tests พร้อม coverage
```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```

### รัน test case เฉพาะ
```bash
pytest tests/test_api.py::test_create_user -v
```

### รัน tests ที่เกี่ยวข้องกับ "borrow"
```bash
pytest tests/ -v -k "borrow"
```
