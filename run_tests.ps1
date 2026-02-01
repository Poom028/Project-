# Script สำหรับรัน tests บน Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Library System - Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่ามี Docker หรือไม่
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerExists) {
    Write-Host "[1] ตรวจพบ Docker" -ForegroundColor Green
    Write-Host ""
    Write-Host "เลือกวิธีรัน tests:" -ForegroundColor Yellow
    Write-Host "  1. รันด้วย Docker (แนะนำ)" -ForegroundColor White
    Write-Host "  2. รันโดยตรง (ต้องมี MongoDB รันอยู่)" -ForegroundColor White
    Write-Host "  3. รัน tests พร้อม coverage" -ForegroundColor White
    Write-Host "  4. รัน test case เฉพาะ" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "เลือก (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "กำลังรัน tests ด้วย Docker..." -ForegroundColor Green
            docker-compose up -d db
            Start-Sleep -Seconds 3
            docker-compose exec backend pytest tests/ -v
        }
        "2" {
            Write-Host ""
            Write-Host "กำลังรัน tests โดยตรง..." -ForegroundColor Green
            Write-Host "ตรวจสอบว่า MongoDB รันอยู่ที่ localhost:27017" -ForegroundColor Yellow
            pytest tests/ -v
        }
        "3" {
            Write-Host ""
            Write-Host "กำลังรัน tests พร้อม coverage..." -ForegroundColor Green
            docker-compose up -d db
            Start-Sleep -Seconds 3
            docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing
        }
        "4" {
            Write-Host ""
            Write-Host "Test cases ที่มี:" -ForegroundColor Yellow
            Write-Host "  1. test_create_user" -ForegroundColor White
            Write-Host "  2. test_create_book" -ForegroundColor White
            Write-Host "  3. test_get_books" -ForegroundColor White
            Write-Host "  4. test_borrow_book_success" -ForegroundColor White
            Write-Host "  5. test_borrow_book_out_of_stock" -ForegroundColor White
            Write-Host "  6. test_borrow_book_user_not_found" -ForegroundColor White
            Write-Host "  7. test_return_book_success" -ForegroundColor White
            Write-Host "  8. test_return_book_no_transaction" -ForegroundColor White
            Write-Host "  9. test_return_book_already_returned" -ForegroundColor White
            Write-Host "  10. test_get_user_history" -ForegroundColor White
            Write-Host "  11. test_delete_book" -ForegroundColor White
            Write-Host "  12. test_isbn_uniqueness" -ForegroundColor White
            Write-Host ""
            $testName = Read-Host "พิมพ์ชื่อ test case (เช่น test_create_user)"
            docker-compose up -d db
            Start-Sleep -Seconds 3
            docker-compose exec backend pytest "tests/test_api.py::$testName" -v
        }
        default {
            Write-Host "เลือกไม่ถูกต้อง" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "[1] ไม่พบ Docker - จะรัน tests โดยตรง" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ตรวจสอบว่า MongoDB รันอยู่ที่ localhost:27017" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "กด Enter เพื่อดำเนินการต่อ"
    pytest tests/ -v
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tests เสร็จสิ้น" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
