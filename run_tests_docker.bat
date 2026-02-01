@echo off
REM Script สำหรับรัน Tests ด้วย Docker
REM ใช้งานง่าย - รันคำสั่งเดียว

echo ========================================
echo    Library System - Docker Test Runner
echo ========================================
echo.

REM ตรวจสอบว่า Docker ทำงานอยู่หรือไม่
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker ไม่ได้รันอยู่
    echo กำลังเริ่ม Docker containers...
    docker-compose up -d
    echo รอให้ containers พร้อม...
    timeout /t 5 /nobreak >nul
)

echo.
echo เลือกการรัน tests:
echo   1. รัน tests ทั้งหมด (12 test cases)
echo   2. รัน tests พร้อม coverage report
echo   3. รัน test case เฉพาะ
echo   4. รัน tests แบบ verbose (แสดงผลละเอียด)
echo   5. ดูรายการ test cases ทั้งหมด
echo.
set /p choice="เลือก (1-5): "

if "%choice%"=="1" (
    echo.
    echo กำลังรัน tests ทั้งหมด...
    docker-compose exec backend pytest tests/ -v
) else if "%choice%"=="2" (
    echo.
    echo กำลังรัน tests พร้อม coverage...
    docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing
) else if "%choice%"=="3" (
    echo.
    echo Test cases ที่มี:
    echo   1. test_create_user
    echo   2. test_create_book
    echo   3. test_get_books
    echo   4. test_borrow_book_success
    echo   5. test_borrow_book_out_of_stock
    echo   6. test_borrow_book_user_not_found
    echo   7. test_return_book_success
    echo   8. test_return_book_no_transaction
    echo   9. test_return_book_already_returned
    echo   10. test_get_user_history
    echo   11. test_delete_book
    echo   12. test_isbn_uniqueness
    echo.
    set /p testName="พิมพ์ชื่อ test case (เช่น test_create_user): "
    echo.
    echo กำลังรัน %testName%...
    docker-compose exec backend pytest tests/test_api.py::%testName% -v
) else if "%choice%"=="4" (
    echo.
    echo กำลังรัน tests แบบ verbose...
    docker-compose exec backend pytest tests/ -v -s
) else if "%choice%"=="5" (
    echo.
    echo รายการ test cases:
    docker-compose exec backend pytest tests/ --collect-only
) else (
    echo เลือกไม่ถูกต้อง
    exit /b 1
)

echo.
echo ========================================
echo    Tests เสร็จสิ้น
echo ========================================
pause
