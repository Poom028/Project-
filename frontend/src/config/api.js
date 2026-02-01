import { Platform } from 'react-native';

// API Configuration
// สำหรับเชื่อมต่อกับ Backend ที่รันใน Docker Container
// สำหรับ Web Browser: ใช้ localhost:8000
// สำหรับ Mobile (Expo Go): ใช้ IP address ของเครื่อง (เช่น http://192.168.1.100:8000)
// ตรวจสอบ IP address ด้วย: ipconfig (Windows) หรือ ifconfig (Mac/Linux)

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
const IP_ADDRESS = '192.168.1.100'; // ⚠️ เปลี่ยนเป็น IP address ของเครื่องคุณ (ดูใน find_ip.ps1)

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

export const API_ENDPOINTS = {
  // Authentication
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login-json`,
  ME: `${API_BASE_URL}/auth/me`,
  
  // Books
  BOOKS: `${API_BASE_URL}/books`,
  BOOK_BY_ID: (id) => `${API_BASE_URL}/books/${id}`,
  
  // Users
  USERS: `${API_BASE_URL}/users`,
  USER_BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
  
  // Admin
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_USER_BY_ID: (id) => `${API_BASE_URL}/admin/users/${id}`,
  ADMIN_UPDATE_USER_ROLE: (id, role) => `${API_BASE_URL}/admin/users/${id}/role?new_role=${role}`,
  ADMIN_DELETE_USER: (id) => `${API_BASE_URL}/admin/users/${id}`,
  ADMIN_STATS: `${API_BASE_URL}/admin/stats`,
  ADMIN_TRANSACTIONS: `${API_BASE_URL}/admin/transactions`,
  ADMIN_TRANSACTION_BY_ID: (id) => `${API_BASE_URL}/admin/transactions/${id}`,
  ADMIN_APPROVE_BORROW: (id) => `${API_BASE_URL}/admin/transactions/${id}/approve-borrow`,
  ADMIN_APPROVE_RETURN: (id) => `${API_BASE_URL}/admin/transactions/${id}/approve-return`,
  
  // Transactions
  BORROW: `${API_BASE_URL}/transactions/borrow`,
  RETURN: `${API_BASE_URL}/transactions/return`,
  USER_HISTORY: (userId) => `${API_BASE_URL}/transactions/user/${userId}`,
};

export default API_BASE_URL;
