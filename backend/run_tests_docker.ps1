# Script สำหรับรัน Tests ด้วย Docker
# ใช้งานง่าย - รันคำสั่งเดียว

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Library System - Docker Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่า Docker ทำงานอยู่หรือไม่
docker ps 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker ไม่ได้รันอยู่" -ForegroundColor Yellow
    Write-Host "กำลังเริ่ม Docker containers..." -ForegroundColor Green
    docker-compose up -d
    Write-Host "รอให้ containers พร้อม..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "เลือกการรัน tests:" -ForegroundColor Yellow
Write-Host "  1. รัน tests ทั้งหมด (10 test cases)" -ForegroundColor White
Write-Host "  2. รัน tests พร้อม coverage report" -ForegroundColor White
Write-Host "  3. รัน test case เฉพาะ" -ForegroundColor White
Write-Host "  4. รัน tests แบบ verbose (แสดงผลละเอียด)" -ForegroundColor White
Write-Host "  5. ดูรายการ test cases ทั้งหมด" -ForegroundColor White
Write-Host ""

$choice = Read-Host "เลือก (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "กำลังรัน tests ทั้งหมด..." -ForegroundColor Green
        docker-compose exec backend pytest tests/ -v
    }
    "2" {
        Write-Host ""
        Write-Host "กำลังรัน tests พร้อม coverage..." -ForegroundColor Green
        docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing
    }
    "3" {
        Write-Host ""
        Write-Host "Test cases ที่มี:" -ForegroundColor Yellow
        Write-Host "  1. test_create_user" -ForegroundColor White
        Write-Host "  2. test_create_book" -ForegroundColor White
        Write-Host "  3. test_get_books" -ForegroundColor White
        Write-Host "  4. test_borrow_book_success" -ForegroundColor White
        Write-Host "  5. test_borrow_book_out_of_stock" -ForegroundColor White
        Write-Host "  6. test_return_book_success" -ForegroundColor White
        Write-Host "  7. test_return_book_no_transaction" -ForegroundColor White
        Write-Host "  8. test_get_user_history" -ForegroundColor White
        Write-Host "  9. test_delete_book" -ForegroundColor White
        Write-Host "  10. test_isbn_uniqueness" -ForegroundColor White
        Write-Host ""
        $testName = Read-Host "พิมพ์ชื่อ test case (เช่น test_create_user)"
        Write-Host ""
        Write-Host "กำลังรัน $testName..." -ForegroundColor Green
        docker-compose exec backend pytest "tests/test_api.py::$testName" -v
    }
    "4" {
        Write-Host ""
        Write-Host "กำลังรัน tests แบบ verbose..." -ForegroundColor Green
        docker-compose exec backend pytest tests/ -v -s
    }
    "5" {
        Write-Host ""
        Write-Host "รายการ test cases:" -ForegroundColor Green
        docker-compose exec backend pytest tests/ --collect-only
    }
    default {
        Write-Host "เลือกไม่ถูกต้อง" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tests เสร็จสิ้น" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
