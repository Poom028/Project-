@echo off
REM Script สำหรับรัน tests บน Windows
REM ใช้ได้ทั้งแบบ Docker และไม่ใช้ Docker

echo ========================================
echo    Library System - Test Runner
echo ========================================
echo.

REM ตรวจสอบว่ามี Docker หรือไม่
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo [1] ตรวจพบ Docker
    echo.
    echo เลือกวิธีรัน tests:
    echo   1. รันด้วย Docker (แนะนำ)
    echo   2. รันโดยตรง (ต้องมี MongoDB รันอยู่)
    echo.
    set /p choice="เลือก (1 หรือ 2): "
    
    if "%choice%"=="1" (
        echo.
        echo กำลังรัน tests ด้วย Docker...
        docker-compose up -d db
        timeout /t 3 /nobreak >nul
        docker-compose exec backend pytest tests/ -v
    ) else if "%choice%"=="2" (
        echo.
        echo กำลังรัน tests โดยตรง...
        echo ตรวจสอบว่า MongoDB รันอยู่ที่ localhost:27017
        pytest tests/ -v
    ) else (
        echo เลือกไม่ถูกต้อง
        exit /b 1
    )
) else (
    echo [1] ไม่พบ Docker - จะรัน tests โดยตรง
    echo.
    echo ตรวจสอบว่า MongoDB รันอยู่ที่ localhost:27017
    echo.
    pause
    pytest tests/ -v
)

echo.
echo ========================================
echo    Tests เสร็จสิ้น
echo ========================================
pause
