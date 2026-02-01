# Script สำหรับเปิดใช้งาน Virtualization Features บน Windows
# ต้องรันด้วย PowerShell as Administrator

Write-Host "=== เปิดใช้งาน Virtualization Features ===" -ForegroundColor Cyan
Write-Host "`nคำเตือน: Script นี้จะเปิดใช้งาน Windows Features ต่อไปนี้:" -ForegroundColor Yellow
Write-Host "- Windows Subsystem for Linux (WSL)" -ForegroundColor White
Write-Host "- Virtual Machine Platform" -ForegroundColor White
Write-Host "- Hyper-V" -ForegroundColor White
Write-Host "- Containers" -ForegroundColor White
Write-Host "`nหลังจากรันเสร็จ ต้อง RESTART คอมพิวเตอร์" -ForegroundColor Red

$confirmation = Read-Host "`nต้องการดำเนินการต่อหรือไม่? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "ยกเลิกการดำเนินการ" -ForegroundColor Yellow
    exit
}

Write-Host "`nกำลังเปิดใช้งาน Windows Features..." -ForegroundColor Green

# เปิดใช้งาน Windows Subsystem for Linux
Write-Host "`n[1/4] เปิดใช้งาน Windows Subsystem for Linux..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "   ✗ ล้มเหลว (อาจเปิดใช้งานแล้ว)" -ForegroundColor Yellow
}

# เปิดใช้งาน Virtual Machine Platform
Write-Host "`n[2/4] เปิดใช้งาน Virtual Machine Platform..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "   ✗ ล้มเหลว (อาจเปิดใช้งานแล้ว)" -ForegroundColor Yellow
}

# เปิดใช้งาน Hyper-V
Write-Host "`n[3/4] เปิดใช้งาน Hyper-V..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V /all /norestart
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "   ✗ ล้มเหลว (อาจเปิดใช้งานแล้ว)" -ForegroundColor Yellow
}

# เปิดใช้งาน Containers
Write-Host "`n[4/4] เปิดใช้งาน Containers..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:Containers /all /norestart
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "   ✗ ล้มเหลว (อาจเปิดใช้งานแล้ว)" -ForegroundColor Yellow
}

Write-Host "`n=== เสร็จสิ้น ===" -ForegroundColor Green
Write-Host "`n⚠️  สำคัญ: ต้อง RESTART คอมพิวเตอร์เพื่อให้การเปลี่ยนแปลงมีผล" -ForegroundColor Red
Write-Host "`nหลังจาก restart แล้ว ให้รันคำสั่งต่อไปนี้:" -ForegroundColor Yellow
Write-Host "wsl --update" -ForegroundColor Gray
Write-Host "wsl --set-default-version 2" -ForegroundColor Gray
Write-Host "`nจากนั้นลองเปิด Docker Desktop อีกครั้ง" -ForegroundColor Yellow

$restart = Read-Host "`nต้องการ restart คอมพิวเตอร์ตอนนี้หรือไม่? (Y/N)"
if ($restart -eq 'Y' -or $restart -eq 'y') {
    Write-Host "กำลัง restart คอมพิวเตอร์..." -ForegroundColor Yellow
    Restart-Computer
}
