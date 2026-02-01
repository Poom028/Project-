# Script สำหรับแก้ไขปัญหา Docker Desktop - Windows 10 Home
# ต้องรันด้วย PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   แก้ไขปัญหา Docker Desktop" -ForegroundColor Cyan
Write-Host "   Windows 10 Home Edition" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่าเป็น Administrator หรือไม่
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  ต้องรัน PowerShell as Administrator!" -ForegroundColor Red
    Write-Host "`nวิธีรัน:" -ForegroundColor Yellow
    Write-Host "1. คลิกขวาที่ PowerShell" -ForegroundColor White
    Write-Host "2. เลือก 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. รันสคริปต์นี้อีกครั้ง" -ForegroundColor White
    Write-Host ""
    Read-Host "กด Enter เพื่อออก"
    exit 1
}

Write-Host "✓ รันด้วยสิทธิ์ Administrator แล้ว" -ForegroundColor Green
Write-Host ""

# ขั้นตอนที่ 1: ตรวจสอบสถานะปัจจุบัน
Write-Host "=== ขั้นตอนที่ 1: ตรวจสอบสถานะปัจจุบัน ===" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบ Virtualization ใน BIOS
Write-Host "[1.1] ตรวจสอบ Virtualization Support..." -ForegroundColor Yellow
try {
    $vmSupport = (Get-ComputerInfo -Property "HyperV*").HyperVRequirementVirtualizationFirmwareEnabled
    if ($vmSupport) {
        Write-Host "   ✓ Virtualization เปิดใช้งานใน BIOS/UEFI" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Virtualization ไม่ได้เปิดใช้งานใน BIOS/UEFI" -ForegroundColor Red
        Write-Host "   ⚠️  กรุณาเปิดใช้งานใน BIOS/UEFI ก่อน!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  ไม่สามารถตรวจสอบได้" -ForegroundColor Yellow
}

# ตรวจสอบ Windows Features
Write-Host "`n[1.2] ตรวจสอบ Windows Features..." -ForegroundColor Yellow

$features = @{
    "Microsoft-Windows-Subsystem-Linux" = "Windows Subsystem for Linux (WSL)"
    "VirtualMachinePlatform" = "Virtual Machine Platform"
    "Containers" = "Containers"
}

$needsRestart = $false
$featuresStatus = @{}

foreach ($feature in $features.Keys) {
    $status = Get-WindowsOptionalFeature -Online -FeatureName $feature -ErrorAction SilentlyContinue
    if ($status) {
        if ($status.State -eq "Enabled") {
            Write-Host "   ✓ $($features[$feature]) เปิดใช้งานแล้ว" -ForegroundColor Green
            $featuresStatus[$feature] = "Enabled"
        } else {
            Write-Host "   ✗ $($features[$feature]) ยังไม่ได้เปิดใช้งาน" -ForegroundColor Red
            $featuresStatus[$feature] = "Disabled"
            $needsRestart = $true
        }
    } else {
        Write-Host "   ⚠️  $($features[$feature]) ไม่พบ feature นี้" -ForegroundColor Yellow
    }
}

# ตรวจสอบ WSL
Write-Host "`n[1.3] ตรวจสอบ WSL..." -ForegroundColor Yellow
$wslCheck = wsl --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ WSL ติดตั้งแล้ว" -ForegroundColor Green
    wsl --version
} else {
    Write-Host "   ✗ WSL ยังไม่ได้ติดตั้งหรืออัปเดต" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ถ้ามี features ที่ยังไม่ได้เปิดใช้งาน
if ($needsRestart) {
    Write-Host "พบ Windows Features ที่ยังไม่ได้เปิดใช้งาน" -ForegroundColor Yellow
    Write-Host ""
    $proceed = Read-Host "ต้องการเปิดใช้งานตอนนี้หรือไม่? (Y/N)"
    
    if ($proceed -eq 'Y' -or $proceed -eq 'y') {
        Write-Host ""
        Write-Host "=== ขั้นตอนที่ 2: เปิดใช้งาน Windows Features ===" -ForegroundColor Cyan
        Write-Host ""
        
        # เปิดใช้งาน WSL
        if ($featuresStatus["Microsoft-Windows-Subsystem-Linux"] -eq "Disabled") {
            Write-Host "[2.1] กำลังเปิดใช้งาน Windows Subsystem for Linux..." -ForegroundColor Yellow
            dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  อาจเกิดข้อผิดพลาด" -ForegroundColor Yellow
            }
        }
        
        # เปิดใช้งาน Virtual Machine Platform
        if ($featuresStatus["VirtualMachinePlatform"] -eq "Disabled") {
            Write-Host "`n[2.2] กำลังเปิดใช้งาน Virtual Machine Platform..." -ForegroundColor Yellow
            dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  อาจเกิดข้อผิดพลาด" -ForegroundColor Yellow
            }
        }
        
        # เปิดใช้งาน Containers
        if ($featuresStatus["Containers"] -eq "Disabled") {
            Write-Host "`n[2.3] กำลังเปิดใช้งาน Containers..." -ForegroundColor Yellow
            dism.exe /online /enable-feature /featurename:Containers /all /norestart
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ สำเร็จ" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  อาจไม่มี feature นี้ใน Windows Home" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  สำคัญ: ต้อง RESTART คอมพิวเตอร์เพื่อให้การเปลี่ยนแปลงมีผล!" -ForegroundColor Red
        Write-Host ""
        Write-Host "หลังจาก restart แล้ว ให้รันสคริปต์นี้อีกครั้งเพื่ออัปเดต WSL" -ForegroundColor Yellow
        Write-Host ""
        
        $restart = Read-Host "ต้องการ restart คอมพิวเตอร์ตอนนี้หรือไม่? (Y/N)"
        if ($restart -eq 'Y' -or $restart -eq 'y') {
            Write-Host "กำลัง restart คอมพิวเตอร์..." -ForegroundColor Yellow
            Restart-Computer
        } else {
            Write-Host "`nกรุณา restart คอมพิวเตอร์ด้วยตนเอง แล้วรันสคริปต์นี้อีกครั้ง" -ForegroundColor Yellow
        }
    }
} else {
    # ถ้า features เปิดใช้งานหมดแล้ว ตรวจสอบ WSL version
    Write-Host "=== ขั้นตอนที่ 2: อัปเดต WSL ===" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[2.1] กำลังอัปเดต WSL..." -ForegroundColor Yellow
    wsl --update
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ อัปเดต WSL สำเร็จ" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  อาจเกิดข้อผิดพลาด" -ForegroundColor Yellow
    }
    
    Write-Host "`n[2.2] ตั้งค่าให้ใช้ WSL 2 เป็น default..." -ForegroundColor Yellow
    wsl --set-default-version 2
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ ตั้งค่า WSL 2 สำเร็จ" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  อาจเกิดข้อผิดพลาด" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "=== ขั้นตอนที่ 3: ตั้งค่า Docker Desktop ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ตอนนี้ควรจะสามารถเปิด Docker Desktop ได้แล้ว" -ForegroundColor Green
    Write-Host ""
    Write-Host "เมื่อเปิด Docker Desktop:" -ForegroundColor Yellow
    Write-Host "1. ไปที่ Settings (ไอคอนเฟือง)" -ForegroundColor White
    Write-Host "2. ไปที่ General" -ForegroundColor White
    Write-Host "3. เปิดใช้งาน 'Use the WSL 2 based engine'" -ForegroundColor White
    Write-Host "4. กด Apply & Restart" -ForegroundColor White
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   เสร็จสิ้น" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}
