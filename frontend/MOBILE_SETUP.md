# คู่มือการตั้งค่าให้ใช้งานบนโทรศัพท์

## ปัญหาที่พบบ่อย

### ❌ Error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
**สาเหตุ:** โทรศัพท์ไม่สามารถเข้าถึง `localhost` ของคอมพิวเตอร์ได้

**วิธีแก้ไข:**
1. ต้องใช้ IP address ของเครื่องที่รัน Backend แทน `localhost`
2. ต้องแน่ใจว่าโทรศัพท์และคอมพิวเตอร์อยู่ในเครือข่ายเดียวกัน (WiFi เดียวกัน)

---

## ขั้นตอนการตั้งค่า

### 1. หา IP Address ของเครื่อง

#### Windows:
```powershell
ipconfig
```
ดูที่ **IPv4 Address** ในส่วน **Wireless LAN adapter Wi-Fi** หรือ **Ethernet adapter**

ตัวอย่าง:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

#### Mac/Linux:
```bash
ifconfig
```
หรือ
```bash
ip addr show
```
ดูที่ **inet** ในส่วน **wlan0** หรือ **eth0**

---

### 2. ตั้งค่า IP Address ในโค้ด

เปิดไฟล์ `frontend/src/config/api.js`

แก้ไขบรรทัดนี้:
```javascript
const IP_ADDRESS = '192.168.1.100'; // เปลี่ยนเป็น IP address ของเครื่องคุณ
```

**ตัวอย่าง:**
- WiFi: `192.168.1.100`
- Ethernet: `192.168.0.50`
- Hotspot: `192.168.43.1`

---

### 3. ตรวจสอบว่า Backend รันอยู่

```bash
# ตรวจสอบว่า Backend รันอยู่
docker-compose ps

# หรือรัน Backend
docker-compose up -d
```

**ทดสอบ Backend:**
เปิดเบราว์เซอร์ไปที่: `http://YOUR_IP_ADDRESS:8000/docs`

ตัวอย่าง: `http://192.168.1.100:8000/docs`

---

### 4. ตรวจสอบ Firewall

#### Windows:
1. เปิด **Windows Defender Firewall**
2. ไปที่ **Advanced settings**
3. ตรวจสอบว่า **Port 8000** ถูกเปิดหรือไม่
4. ถ้าไม่เปิด ให้เพิ่ม **Inbound Rule** สำหรับ port 8000

#### Mac:
```bash
# เปิด port 8000
sudo pfctl -f /etc/pf.conf
```

---

### 5. ตรวจสอบ Network

**ต้องแน่ใจว่า:**
- ✅ โทรศัพท์และคอมพิวเตอร์อยู่ใน WiFi เดียวกัน
- ✅ Backend รันอยู่ที่ port 8000
- ✅ IP address ถูกต้อง
- ✅ Firewall ไม่อุดกั้น port 8000

---

## วิธีทดสอบ

### 1. ทดสอบจากคอมพิวเตอร์
```bash
# ทดสอบว่า Backend ทำงาน
curl http://YOUR_IP_ADDRESS:8000/books/
```

### 2. ทดสอบจากโทรศัพท์
1. เปิด Expo Go app
2. สแกน QR Code
3. ตรวจสอบ Console logs ใน Expo Dev Tools
4. ดูว่า API URL ถูกต้องหรือไม่

---

## Troubleshooting

### ❌ ยังเชื่อมต่อไม่ได้

1. **ตรวจสอบ IP Address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **ทดสอบ Backend:**
   - เปิดเบราว์เซอร์: `http://YOUR_IP:8000/docs`
   - ควรเห็น Swagger UI

3. **ตรวจสอบ Network:**
   - โทรศัพท์และคอมพิวเตอร์อยู่ใน WiFi เดียวกันหรือไม่?
   - ลองปิด/เปิด WiFi ใหม่

4. **ตรวจสอบ Firewall:**
   - Windows: เปิด Windows Defender Firewall
   - Mac: ตรวจสอบ System Preferences > Security & Privacy

5. **ลองใช้ Hotspot:**
   - เปิด Hotspot จากโทรศัพท์
   - เชื่อมต่อคอมพิวเตอร์กับ Hotspot
   - ใช้ IP ของ Hotspot (มักจะเป็น `192.168.43.1`)

---

## ตัวอย่างการตั้งค่า

### กรณีที่ 1: WiFi Network
```
คอมพิวเตอร์ IP: 192.168.1.100
โทรศัพท์: เชื่อมต่อ WiFi เดียวกัน
ตั้งค่า: const IP_ADDRESS = '192.168.1.100';
```

### กรณีที่ 2: Mobile Hotspot
```
คอมพิวเตอร์: เชื่อมต่อ Hotspot จากโทรศัพท์
Hotspot IP: 192.168.43.1
ตั้งค่า: const IP_ADDRESS = '192.168.43.1';
```

### กรณีที่ 3: Ethernet
```
คอมพิวเตอร์ IP: 192.168.0.50
โทรศัพท์: เชื่อมต่อ WiFi เดียวกัน
ตั้งค่า: const IP_ADDRESS = '192.168.0.50';
```

---

## หมายเหตุ

- IP address อาจเปลี่ยนเมื่อ reconnect WiFi
- ถ้า IP เปลี่ยน ต้องอัปเดตใน `api.js` ใหม่
- สำหรับ Production ควรใช้ domain name แทน IP address
