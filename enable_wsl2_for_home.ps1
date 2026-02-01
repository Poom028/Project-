# Script สำหรับเปิดใช้งาน WSL 2 บน Windows 10 Home
# Docker Desktop สามารถใช้ WSL 2 backend แทน Hyper-V
# ต้องรันด้วย PowerShell as Administrator

Write-Host "=== เปิดใช้งาน WSL 2 สำหรับ Windows 10 Home ===" -ForegroundColor Cyan
Write-Host "`nหมายเหตุ: Windows 10 Home ไม่มี Hyper-V" -ForegroundColor Yellow
Write-Host "Docker Desktop จะใช้ WSL 2 backend แทน" -ForegroundColor Yellow

Write-Host "`nคำเตือน: Script นี้จะเปิดใช้งาน Windows Features ต่อไปนี้:" -ForegroundColor Yellow
Write-Host "- Windows Subsystem for Linux (WSL)" -ForegroundColor White
Write-Host "- Virtual Machine Platform" -ForegroundColor White
Write-Host "- Containers (ถ้ามี)" -ForegroundColor White
Write-Host "`nหลังจากรันเสร็จ ต้อง RESTART คอมพิวเตอร์" -ForegroundColor Red

$confirmation = Read-Host "`nต้องการดำเนินการต่อหรือไม่? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "ยกเลิกการดำเนินการ" -ForegroundColor Yellow
    exit
}

Write-Host "`nกำลังเปิดใช้งาน Windows Features..." -ForegroundColor Green

# เปิดใช้งาน Windows Subsystem for Linux
Write-Host "`n[1/3] เปิดใช้งาน Windows Subsystem for Linux (WSL)..." -ForegroundColor Cyan
$result1 = dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "   ⚠  อาจเปิดใช้งานแล้วหรือเกิดข้อผิดพลาด" -ForegroundColor Yellow
}

# เปิดใช้งาน Virtual Machine Platform (จำเป็นสำหรับ WSL 2)
Write-Host "`n[2/3] เปิดใช้งาน Virtual Machine Platform..." -ForegroundColor Cyan
$result2 = dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "   ⚠  อาจเปิดใช้งานแล้วหรือเกิดข้อผิดพลาด" -ForegroundColor Yellow
}

# เปิดใช้งาน Containers (ถ้ามี)
Write-Host "`n[3/3] เปิดใช้งาน Containers..." -ForegroundColor Cyan
$result3 = dism.exe /online /enable-feature /featurename:Containers /all /norestart
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "   ⚠  อาจไม่มี feature นี้ใน Windows Home หรือเปิดใช้งานแล้ว" -ForegroundColor Yellow
}

Write-Host "`n=== เสร็จสิ้น ===" -ForegroundColor Green
Write-Host "`n⚠️  สำคัญ: ต้อง RESTART คอมพิวเตอร์เพื่อให้การเปลี่ยนแปลงมีผล" -ForegroundColor Red

Write-Host "`n=== ขั้นตอนต่อไป (หลังจาก restart) ===" -ForegroundColor Cyan
Write-Host "`n1. อัปเดต WSL เป็นเวอร์ชันล่าสุด:" -ForegroundColor Yellow
Write-Host "   wsl --update" -ForegroundColor Gray
Write-Host "`n2. ตั้งค่าให้ใช้ WSL 2 เป็น default:" -ForegroundColor Yellow
Write-Host "   wsl --set-default-version 2" -ForegroundColor Gray
Write-Host "`n3. ตรวจสอบ WSL version:" -ForegroundColor Yellow
Write-Host "   wsl --version" -ForegroundColor Gray
Write-Host "`n4. เปิด Docker Desktop และตั้งค่าให้ใช้ WSL 2 backend:" -ForegroundColor Yellow
Write-Host "   - ไปที่ Settings > General" -ForegroundColor Gray
Write-Host "   - เปิดใช้งาน 'Use the WSL 2 based engine'" -ForegroundColor Gray
Write-Host "   - ไปที่ Settings > Resources > WSL Integration" -ForegroundColor Gray
Write-Host "   - เปิดใช้งาน integration กับ WSL distro ที่ต้องการ" -ForegroundColor Gray

$restart = Read-Host "`nต้องการ restart คอมพิวเตอร์ตอนนี้หรือไม่? (Y/N)"
if ($restart -eq 'Y' -or $restart -eq 'y') {
    Write-Host "กำลัง restart คอมพิวเตอร์..." -ForegroundColor Yellow
    Restart-Computer
} else {
    Write-Host "`nกรุณา restart คอมพิวเตอร์ด้วยตนเองก่อนดำเนินการต่อ" -ForegroundColor Yellow
}
