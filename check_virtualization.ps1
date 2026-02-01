# Script สำหรับตรวจสอบและเปิดใช้งาน Virtualization บน Windows
# รันด้วย PowerShell as Administrator

Write-Host "=== ตรวจสอบสถานะ Virtualization ===" -ForegroundColor Cyan

# ตรวจสอบว่า Virtualization เปิดใช้งานใน BIOS หรือไม่
Write-Host "`n1. ตรวจสอบ Virtualization Support:" -ForegroundColor Yellow
$vmSupport = (Get-ComputerInfo -Property "HyperV*").HyperVRequirementVirtualizationFirmwareEnabled
if ($vmSupport) {
    Write-Host "   ✓ Virtualization เปิดใช้งานใน BIOS/UEFI" -ForegroundColor Green
} else {
    Write-Host "   ✗ Virtualization ไม่ได้เปิดใช้งานใน BIOS/UEFI" -ForegroundColor Red
    Write-Host "   กรุณาเปิดใช้งานใน BIOS/UEFI และ restart คอมพิวเตอร์" -ForegroundColor Yellow
}

# ตรวจสอบ Windows Features
Write-Host "`n2. ตรวจสอบ Windows Features:" -ForegroundColor Yellow

$features = @{
    "Microsoft-Hyper-V" = "Hyper-V"
    "VirtualMachinePlatform" = "Virtual Machine Platform"
    "Microsoft-Windows-Subsystem-Linux" = "Windows Subsystem for Linux"
    "Containers" = "Containers"
}

foreach ($feature in $features.Keys) {
    $status = Get-WindowsOptionalFeature -Online -FeatureName $feature -ErrorAction SilentlyContinue
    if ($status) {
        if ($status.State -eq "Enabled") {
            Write-Host "   ✓ $($features[$feature]) เปิดใช้งานแล้ว" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $($features[$feature]) ยังไม่ได้เปิดใช้งาน" -ForegroundColor Red
        }
    }
}

# ตรวจสอบ WSL
Write-Host "`n3. ตรวจสอบ WSL:" -ForegroundColor Yellow
$wslVersion = wsl --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ WSL ติดตั้งแล้ว" -ForegroundColor Green
    wsl --version
} else {
    Write-Host "   ✗ WSL ยังไม่ได้ติดตั้ง" -ForegroundColor Red
}

# คำแนะนำการแก้ไข
Write-Host "`n=== คำแนะนำการแก้ไข ===" -ForegroundColor Cyan
Write-Host "`nหาก Virtualization ยังไม่ได้เปิดใช้งาน ให้รันคำสั่งต่อไปนี้ใน PowerShell as Administrator:" -ForegroundColor Yellow
Write-Host "`n# เปิดใช้งาน Windows Features ที่จำเป็น:" -ForegroundColor White
Write-Host "dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart" -ForegroundColor Gray
Write-Host "dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart" -ForegroundColor Gray
Write-Host "dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V /all /norestart" -ForegroundColor Gray
Write-Host "dism.exe /online /enable-feature /featurename:Containers /all /norestart" -ForegroundColor Gray
Write-Host "`n# หลังจากรันคำสั่งแล้ว ต้อง RESTART คอมพิวเตอร์" -ForegroundColor Yellow
Write-Host "`n# หลังจาก restart แล้ว รันคำสั่งนี้เพื่ออัปเดต WSL:" -ForegroundColor Yellow
Write-Host "wsl --update" -ForegroundColor Gray
Write-Host "wsl --set-default-version 2" -ForegroundColor Gray
