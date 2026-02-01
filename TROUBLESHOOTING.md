# คู่มือแก้ไขปัญหา Docker Desktop - Virtualization Support

## ปัญหา: "Virtualization support not detected"

แม้ว่าจะเปิดใช้งาน Virtualization ใน BIOS/UEFI แล้ว แต่ Docker Desktop ยังไม่สามารถทำงานได้

## ⚠️ สำคัญ: Windows 10 Home Edition

**Windows 10 Home ไม่มี Hyper-V** แต่ Docker Desktop สามารถใช้ **WSL 2 backend** แทนได้

หากคุณใช้ Windows 10 Home:
- ✅ ใช้ WSL 2 แทน Hyper-V
- ✅ เปิดใช้งาน "Windows Subsystem for Linux" และ "Virtual Machine Platform"
- ❌ ไม่ต้องเปิดใช้งาน Hyper-V (ไม่มีใน Home Edition)

## วิธีแก้ไขทีละขั้นตอน

### ขั้นตอนที่ 1: ตรวจสอบสถานะปัจจุบัน

รัน PowerShell **as Administrator** และรันสคริปต์ตรวจสอบ:

```powershell
.\check_virtualization.ps1
```

หรือตรวจสอบด้วยตนเอง:

```powershell
# ตรวจสอบ Virtualization ใน BIOS
(Get-ComputerInfo -Property "HyperV*").HyperVRequirementVirtualizationFirmwareEnabled

# ตรวจสอบ Windows Features
Get-WindowsOptionalFeature -Online | Where-Object {$_.FeatureName -like "*Hyper*" -or $_.FeatureName -like "*Virtual*" -or $_.FeatureName -like "*Container*" -or $_.FeatureName -like "*WSL*"}
```

### ขั้นตอนที่ 2: เปิดใช้งาน Windows Features ที่จำเป็น

#### สำหรับ Windows 10 Home (แนะนำ):

รัน PowerShell **as Administrator** และรันสคริปต์สำหรับ Home Edition:

```powershell
.\enable_wsl2_for_home.ps1
```

หรือเปิดใช้งานด้วยตนเอง:

```powershell
# 1. Windows Subsystem for Linux (WSL) - จำเป็น
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 2. Virtual Machine Platform - จำเป็นสำหรับ WSL 2
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 3. Containers (ถ้ามี)
dism.exe /online /enable-feature /featurename:Containers /all /norestart
```

**หมายเหตุ**: Windows 10 Home **ไม่มี Hyper-V** ไม่ต้องเปิดใช้งาน

#### สำหรับ Windows 10 Pro/Enterprise/Education:

รัน PowerShell **as Administrator** และรันสคริปต์อัตโนมัติ:

```powershell
.\enable_virtualization.ps1
```

หรือเปิดใช้งานด้วยตนเอง:

```powershell
# 1. Windows Subsystem for Linux (WSL)
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 2. Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 3. Hyper-V
dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V /all /norestart

# 4. Containers
dism.exe /online /enable-feature /featurename:Containers /all /norestart
```

### ขั้นตอนที่ 3: RESTART คอมพิวเตอร์

⚠️ **สำคัญ**: ต้อง restart คอมพิวเตอร์หลังจากเปิดใช้งาน Windows Features

### ขั้นตอนที่ 4: อัปเดต WSL (หลังจาก restart)

```powershell
# อัปเดต WSL เป็นเวอร์ชันล่าสุด
wsl --update

# ตั้งค่าให้ใช้ WSL 2 เป็น default
wsl --set-default-version 2
```

### ขั้นตอนที่ 5: ตรวจสอบอีกครั้ง

```powershell
# ตรวจสอบ WSL version
wsl --version

# ตรวจสอบว่า WSL 2 พร้อมใช้งาน
wsl --status
```

### ขั้นตอนที่ 6: ตั้งค่า Docker Desktop ให้ใช้ WSL 2

1. เปิด **Docker Desktop**
2. ไปที่ **Settings** (ไอคอนเฟือง)
3. ไปที่ **General**
4. เปิดใช้งาน **"Use the WSL 2 based engine"** (ถ้ายังไม่ได้เปิด)
5. ไปที่ **Resources** > **WSL Integration**
6. เปิดใช้งาน integration กับ WSL distro ที่ต้องการ (ถ้ามี)
7. กด **Apply & Restart**

### ขั้นตอนที่ 7: ตรวจสอบว่า Docker Desktop ทำงาน

ลองเปิด Docker Desktop อีกครั้งและตรวจสอบว่า Engine ทำงานแล้ว

## วิธีเปิดใช้งานผ่าน GUI (Windows Features)

1. กด `Win + R` พิมพ์ `optionalfeatures` แล้วกด Enter
2. เปิดใช้งาน features ต่อไปนี้:
   - ☑️ **Windows Subsystem for Linux**
   - ☑️ **Virtual Machine Platform**
   - ☑️ **Hyper-V** (ถ้าใช้ Windows Pro/Enterprise/Education)
   - ☑️ **Containers**
3. กด OK และ restart คอมพิวเตอร์

## วิธีเปิดใช้งานผ่าน Settings

1. เปิด **Settings** (Win + I)
2. ไปที่ **Apps** > **Optional Features** > **More Windows Features**
3. เปิดใช้งาน features ตามที่ระบุข้างต้น
4. Restart คอมพิวเตอร์

## ปัญหาที่พบบ่อย

### ปัญหา: "Hyper-V is not available on this system"

**สาเหตุ**: ใช้ Windows Home Edition ซึ่งไม่รองรับ Hyper-V

**วิธีแก้**: 
- ใช้ WSL 2 แทน (Docker Desktop รองรับ WSL 2 backend)
- หรืออัปเกรดเป็น Windows Pro/Enterprise/Education

### ปัญหา: "WSL 2 installation is incomplete"

**วิธีแก้**:
```powershell
wsl --update
wsl --set-default-version 2
```

### ปัญหา: ยังไม่ทำงานหลังจากทำทุกอย่างแล้ว

**วิธีแก้**:
1. ตรวจสอบว่า BIOS/UEFI เปิดใช้งาน Virtualization จริงๆ
2. ตรวจสอบว่าไม่มี software อื่นที่ใช้ Virtualization (เช่น VirtualBox, VMware)
3. ลองปิดและเปิด Docker Desktop ใหม่
4. ลอง restart Docker Desktop service:
   ```powershell
   Restart-Service -Name "com.docker.service"
   ```

## ตรวจสอบ System Requirements

Docker Desktop ต้องการ:
- Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 หรือใหม่กว่า)
- หรือ Windows 11 64-bit
- Virtualization เปิดใช้งานใน BIOS/UEFI
- WSL 2 feature เปิดใช้งาน
- 4GB RAM อย่างน้อย
- BIOS-level hardware virtualization support

## คำสั่งตรวจสอบเพิ่มเติม

```powershell
# ตรวจสอบ CPU virtualization support
systeminfo | findstr /C:"Hyper-V"

# ตรวจสอบว่า Virtualization เปิดใช้งาน
Get-ComputerInfo | Select-Object HyperV*

# ตรวจสอบ Docker Desktop service
Get-Service | Where-Object {$_.Name -like "*docker*"}
```

## ข้อมูลเพิ่มเติม

- [Docker Desktop for Windows System Requirements](https://docs.docker.com/desktop/install/windows-install/)
- [WSL 2 Installation Guide](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Enable Hyper-V on Windows](https://learn.microsoft.com/en-us/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v)
