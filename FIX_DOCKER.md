# คู่มือแก้ไขปัญหา Docker Desktop - Windows 10 Home

## ปัญหา: "Virtualization support not detected"

แม้ว่าจะเปิดใช้งาน Virtualization ใน BIOS/UEFI แล้ว แต่ Docker Desktop ยังไม่สามารถทำงานได้

---

## วิธีแก้ไขแบบทีละขั้นตอน

### ขั้นตอนที่ 1: รันสคริปต์อัตโนมัติ (แนะนำ)

1. **เปิด PowerShell as Administrator:**
   - คลิกขวาที่ PowerShell
   - เลือก "Run as Administrator"

2. **รันสคริปต์:**
   ```powershell
   .\fix_docker.ps1
   ```

3. **ทำตามคำแนะนำในสคริปต์:**
   - สคริปต์จะตรวจสอบสถานะปัจจุบัน
   - ถ้ามี features ที่ยังไม่ได้เปิดใช้งาน จะถามว่าต้องการเปิดใช้งานหรือไม่
   - หลังจากเปิดใช้งาน ต้อง **RESTART คอมพิวเตอร์**

4. **หลังจาก restart:**
   - รันสคริปต์นี้อีกครั้งเพื่ออัปเดต WSL
   - เปิด Docker Desktop และตั้งค่าให้ใช้ WSL 2

---

## วิธีแก้ไขด้วยตนเอง

### ขั้นตอนที่ 1: เปิดใช้งาน Windows Features

รัน PowerShell **as Administrator** แล้วรันคำสั่ง:

```powershell
# 1. เปิดใช้งาน Windows Subsystem for Linux (WSL)
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 2. เปิดใช้งาน Virtual Machine Platform (จำเป็นสำหรับ WSL 2)
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 3. เปิดใช้งาน Containers (ถ้ามี)
dism.exe /online /enable-feature /featurename:Containers /all /norestart
```

### ขั้นตอนที่ 2: RESTART คอมพิวเตอร์

⚠️ **สำคัญ**: ต้อง restart หลังจากเปิดใช้งาน Windows Features

### ขั้นตอนที่ 3: อัปเดต WSL (หลัง restart)

```powershell
# อัปเดต WSL เป็นเวอร์ชันล่าสุด
wsl --update

# ตั้งค่าให้ใช้ WSL 2 เป็น default
wsl --set-default-version 2

# ตรวจสอบ
wsl --version
```

### ขั้นตอนที่ 4: ตั้งค่า Docker Desktop

1. เปิด **Docker Desktop**
2. ไปที่ **Settings** (ไอคอนเฟือง)
3. ไปที่ **General**
4. เปิดใช้งาน **"Use the WSL 2 based engine"**
5. ไปที่ **Resources** > **WSL Integration**
6. เปิดใช้งาน integration กับ WSL distro ที่ต้องการ (ถ้ามี)
7. กด **Apply & Restart**

---

## วิธีเปิดใช้งานผ่าน GUI

### วิธีที่ 1: ใช้ Windows Features

1. กด `Win + R`
2. พิมพ์ `optionalfeatures` แล้วกด Enter
3. เปิดใช้งาน:
   - ☑️ **Windows Subsystem for Linux**
   - ☑️ **Virtual Machine Platform**
   - ☑️ **Containers** (ถ้ามี)
4. กด **OK** และ **RESTART**

### วิธีที่ 2: ใช้ Settings

1. เปิด **Settings** (Win + I)
2. ไปที่ **Apps** > **Optional Features** > **More Windows Features**
3. เปิดใช้งาน features ตามที่ระบุข้างต้น
4. **RESTART** คอมพิวเตอร์

---

## ตรวจสอบสถานะ

### ตรวจสอบ Virtualization ใน BIOS

```powershell
(Get-ComputerInfo -Property "HyperV*").HyperVRequirementVirtualizationFirmwareEnabled
```

ควรแสดง `True`

### ตรวจสอบ Windows Features

```powershell
Get-WindowsOptionalFeature -Online | Where-Object {
    $_.FeatureName -like "*WSL*" -or 
    $_.FeatureName -like "*Virtual*" -or 
    $_.FeatureName -like "*Container*"
} | Select-Object FeatureName, State
```

ควรแสดง `Enabled` สำหรับ:
- Microsoft-Windows-Subsystem-Linux
- VirtualMachinePlatform

### ตรวจสอบ WSL

```powershell
wsl --version
wsl --status
```

---

## แก้ไขปัญหาเพิ่มเติม

### ปัญหา: WSL installation is incomplete

**วิธีแก้:**
```powershell
wsl --update
wsl --set-default-version 2
```

### ปัญหา: Docker Desktop ยังไม่ทำงานหลังจากทำทุกอย่างแล้ว

**วิธีแก้:**
1. **ปิด Docker Desktop** ทั้งหมด
2. **Restart Docker Desktop service:**
   ```powershell
   Restart-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
   ```
3. **ลองเปิด Docker Desktop อีกครั้ง**

### ปัญหา: Virtualization ยังไม่ทำงาน

**ตรวจสอบ:**
1. ตรวจสอบว่าเปิดใช้งาน Virtualization ใน BIOS/UEFI จริงๆ
2. ตรวจสอบว่าไม่มี software อื่นที่ใช้ Virtualization (เช่น VirtualBox, VMware)
3. ลองปิดและเปิดคอมพิวเตอร์ใหม่

### ปัญหา: Windows 10 Home ไม่มี Containers feature

**ไม่เป็นไร**: Windows 10 Home ไม่จำเป็นต้องมี Containers feature
- ใช้ WSL 2 แทนได้
- Docker Desktop รองรับ WSL 2 backend

---

## System Requirements

Docker Desktop ต้องการ:
- ✅ Windows 10 64-bit: Home, Pro, Enterprise, or Education (Build 19041 หรือใหม่กว่า)
- ✅ Virtualization เปิดใช้งานใน BIOS/UEFI
- ✅ WSL 2 feature เปิดใช้งาน
- ✅ 4GB RAM อย่างน้อย
- ✅ BIOS-level hardware virtualization support

---

## คำสั่งตรวจสอบทั้งหมด

```powershell
# ตรวจสอบ Virtualization
(Get-ComputerInfo -Property "HyperV*").HyperVRequirementVirtualizationFirmwareEnabled

# ตรวจสอบ Windows Features
Get-WindowsOptionalFeature -Online | Where-Object {
    $_.FeatureName -like "*WSL*" -or 
    $_.FeatureName -like "*Virtual*" -or 
    $_.FeatureName -like "*Container*"
}

# ตรวจสอบ WSL
wsl --version
wsl --status

# ตรวจสอบ Docker
docker --version
docker-compose --version
```

---

## สรุปขั้นตอน

1. ✅ เปิดใช้งาน Virtualization ใน BIOS/UEFI
2. ✅ เปิดใช้งาน Windows Features (WSL, Virtual Machine Platform)
3. ✅ RESTART คอมพิวเตอร์
4. ✅ อัปเดต WSL (`wsl --update`, `wsl --set-default-version 2`)
5. ✅ ตั้งค่า Docker Desktop ให้ใช้ WSL 2 backend
6. ✅ เปิด Docker Desktop และตรวจสอบว่า Engine ทำงาน

---

## ข้อมูลเพิ่มเติม

- [Docker Desktop for Windows System Requirements](https://docs.docker.com/desktop/install/windows-install/)
- [WSL 2 Installation Guide](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Enable Hyper-V on Windows](https://learn.microsoft.com/en-us/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v)
