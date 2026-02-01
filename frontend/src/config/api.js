/**
 * ## API Configuration - การตั้งค่า API Endpoints
 * 
 * ไฟล์นี้จัดการการตั้งค่า API endpoints ทั้งหมดสำหรับ Frontend
 * - กำหนด Base URL สำหรับ Web และ Mobile
 * - สร้าง API endpoints ทั้งหมดที่ใช้ในแอป
 * - จัดการ Platform-specific configuration (Web vs Mobile)
 */

import { Platform } from 'react-native';

## ============================================
## Base URL Configuration - ตั้งค่า Base URL
## ============================================

## สำหรับ Web Browser - ใช้ localhost เพราะรันบนเครื่องเดียวกัน
## สำหรับ Mobile (Expo Go) - ต้องใช้ IP address เพราะโทรศัพท์เป็นเครื่องแยก
## ตรวจสอบ IP address ด้วย: ipconfig (Windows) หรือ ifconfig (Mac/Linux)

// สำหรับ Web Browser
const API_BASE_URL_WEB = 'http://localhost:8000';

// สำหรับ Mobile - เปลี่ยนเป็น IP address ของเครื่องที่รัน Backend
// วิธีหา IP:
//   Windows: ipconfig (ดูที่ IPv4 Address)
//   Mac/Linux: ifconfig (ดูที่ inet)
//   หรือใช้ IP ที่แสดงใน Expo Dev Tools
// 
// ตัวอย่าง IP addresses:
//   - WiFi: http://192.168.1.100:8000
//   - Ethernet: http://192.168.0.100:8000
//   - Hotspot: http://192.168.43.1:8000
//
// ⚠️ สำคัญ: ต้องแน่ใจว่า Backend รันอยู่และเปิด port 8000
// ⚠️ ต้องแน่ใจว่าโทรศัพท์และคอมพิวเตอร์อยู่ในเครือข่ายเดียวกัน

// ตั้งค่า IP address ของเครื่องที่รัน Backend
// เปลี่ยนค่า IP_ADDRESS นี้เป็น IP address ของเครื่องคุณ
// 
// วิธีหา IP address:
//   1. รันสคริปต์: .\frontend\find_ip.ps1
//   2. หรือใช้คำสั่ง: ipconfig (Windows) / ifconfig (Mac/Linux)
//   3. ดูที่ IPv4 Address ในส่วน WiFi หรือ Ethernet
//
// ⚠️ สำคัญ: ต้องใช้ IP address ที่อยู่ในเครือข่ายเดียวกับโทรศัพท์
// ใช้ IP address ของ Wi-Fi adapter (ไม่ใช่ Docker network IP)
// รัน .\frontend\find_ip.ps1 เพื่อหา IP address อัตโนมัติ
const IP_ADDRESS = '172.29.60.61'; // ⚠️ เปลี่ยนเป็น IP address ของเครื่องคุณ (ดูใน find_ip.ps1)

// สำหรับการทดสอบ: ถ้าใช้ Expo Tunnel หรือต้องการใช้ localhost
// const API_BASE_URL_MOBILE = 'http://localhost:8000'; // สำหรับ Expo Tunnel

const API_BASE_URL_MOBILE = `http://${IP_ADDRESS}:8000`;

// ใช้ Platform เพื่อตรวจสอบว่าเป็น Web หรือ Mobile
const API_BASE_URL = Platform.OS === 'web' ? API_BASE_URL_WEB : API_BASE_URL_MOBILE;

// Debug: แสดง API URL ที่ใช้
if (__DEV__) {
  console.log('🌐 API Configuration:');
  console.log('   Platform:', Platform.OS);
  console.log('   API Base URL:', API_BASE_URL);
  if (Platform.OS !== 'web') {
    console.log('   ⚠️  สำหรับ Mobile: ตรวจสอบว่า IP address ถูกต้อง:', IP_ADDRESS);
    console.log('   ⚠️  ตรวจสอบว่า Backend รันอยู่ที่:', API_BASE_URL);
  }
}

## ============================================
## API Endpoints - รายการ API Endpoints ทั้งหมด
## ============================================

export const API_ENDPOINTS = {
  ## Authentication Endpoints - จัดการการยืนยันตัวตน
  REGISTER: `${API_BASE_URL}/auth/register`,  // สมัครสมาชิก
  LOGIN: `${API_BASE_URL}/auth/login-json`,  // เข้าสู่ระบบ (JSON format)
  ME: `${API_BASE_URL}/auth/me`,  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  
  ## Books Endpoints - จัดการข้อมูลหนังสือ
  BOOKS: `${API_BASE_URL}/books`,  // ดึงรายการหนังสือทั้งหมด
  BOOK_BY_ID: (id) => `${API_BASE_URL}/books/${id}`,  // ดึงข้อมูลหนังสือตาม ID
  
  ## Users Endpoints - จัดการข้อมูลผู้ใช้
  USERS: `${API_BASE_URL}/users`,  // สร้างผู้ใช้ใหม่
  USER_BY_ID: (id) => `${API_BASE_URL}/users/${id}`,  // ดึงข้อมูลผู้ใช้ตาม ID
  
  ## Admin Endpoints - จัดการฟีเจอร์สำหรับ Admin
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,  // ดึงรายการผู้ใช้ทั้งหมด (Admin only)
  ADMIN_USER_BY_ID: (id) => `${API_BASE_URL}/admin/users/${id}`,  // ดึงข้อมูลผู้ใช้ตาม ID (Admin only)
  ADMIN_UPDATE_USER_ROLE: (id, role) => `${API_BASE_URL}/admin/users/${id}/role?new_role=${role}`,  // แก้ไขบทบาทผู้ใช้ (Admin only)
  ADMIN_DELETE_USER: (id) => `${API_BASE_URL}/admin/users/${id}`,  // ลบผู้ใช้ (Admin only)
  ADMIN_STATS: `${API_BASE_URL}/admin/stats`,  // ดึงสถิติระบบ (Admin only)
  ADMIN_TRANSACTIONS: `${API_BASE_URL}/admin/transactions`,  // ดึงรายการ transactions ทั้งหมด (Admin only)
  ADMIN_TRANSACTION_BY_ID: (id) => `${API_BASE_URL}/admin/transactions/${id}`,  // ดึงข้อมูล transaction ตาม ID (Admin only)
  ADMIN_APPROVE_BORROW: (id) => `${API_BASE_URL}/admin/transactions/${id}/approve-borrow`,  // อนุมัติการยืม (Admin only)
  ADMIN_APPROVE_RETURN: (id) => `${API_BASE_URL}/admin/transactions/${id}/approve-return`,  // อนุมัติการคืน (Admin only)
  
  ## Transactions Endpoints - จัดการการยืม-คืนหนังสือ
  BORROW: `${API_BASE_URL}/transactions/borrow`,  // ยืมหนังสือ (สร้าง transaction แบบ Pending)
  RETURN: `${API_BASE_URL}/transactions/return`,  // คืนหนังสือ (เปลี่ยน status เป็น PendingReturn)
  USER_HISTORY: (userId) => `${API_BASE_URL}/transactions/user/${userId}`,  // ดูประวัติการยืม-คืนของผู้ใช้
};

export default API_BASE_URL;
