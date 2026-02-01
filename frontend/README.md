# Frontend - Library Management System

Frontend สำหรับระบบยืม-คืนหนังสือที่พัฒนาด้วย Expo (React Native)

## เทคโนโลยีที่ใช้

- **Framework**: Expo
- **Language**: JavaScript (React Native)
- **Navigation**: React Navigation
- **HTTP Client**: Axios

## การติดตั้ง

```bash
cd frontend
npm install
```

## การรัน

### Web Browser (ทดสอบบน PC)

```bash
npm run web
```

แอปจะเปิดในเว็บเบราว์เซอร์ที่ `http://localhost:19006`

### Mobile (ทดสอบผ่าน Expo Go)

1. **ติดตั้ง Expo Go** บนมือถือ:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **รัน Expo:**
   ```bash
   npm start
   ```

3. **สแกน QR Code** ด้วย Expo Go app

## การเชื่อมต่อกับ Backend

### สำหรับ Web Browser

Frontend จะเชื่อมต่อกับ Backend ที่ `http://localhost:8000` โดยอัตโนมัติ

### สำหรับ Mobile (Expo Go)

1. **ตรวจสอบ IP Address ของเครื่อง:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **แก้ไขไฟล์ `src/config/api.js`:**
   ```javascript
   const API_BASE_URL_MOBILE = 'http://YOUR_IP_ADDRESS:8000';
   ```
   ตัวอย่าง: `http://192.168.1.100:8000`

3. **ตรวจสอบว่า Backend รันอยู่:**
   ```bash
   docker-compose up -d
   ```

4. **ตรวจสอบว่า Backend ทำงาน:**
   - เปิดเบราว์เซอร์ไปที่ `http://localhost:8000/docs`
   - ควรเห็น Swagger UI

## Features

- 📚 **จัดการหนังสือ**: ดูรายการ, เพิ่ม, ลบหนังสือ
- 👥 **จัดการผู้ใช้**: สร้างผู้ใช้ใหม่
- 📖 **การยืม-คืน**: ยืมหนังสือ, คืนหนังสือ, ดูประวัติ

## โครงสร้างโปรเจกต์

```
frontend/
├── src/
│   ├── config/
│   │   └── api.js          # API configuration
│   ├── services/
│   │   └── api.js          # API service functions
│   └── screens/
│       ├── HomeScreen.js           # หน้าหลัก
│       ├── BooksScreen.js          # จัดการหนังสือ
│       ├── UsersScreen.js          # จัดการผู้ใช้
│       └── TransactionsScreen.js   # การยืม-คืน
├── App.js                   # Main app component
└── package.json
```

## หมายเหตุ

- Frontend ต้องเชื่อมต่อกับ Backend ที่รันใน Docker Container
- สำหรับ Mobile: ต้องใช้ IP address ของเครื่อง ไม่ใช่ localhost
- ตรวจสอบว่า Backend container รันอยู่ก่อนใช้งาน Frontend
