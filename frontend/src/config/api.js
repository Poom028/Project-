import { Platform } from 'react-native';

// API Configuration
// สำหรับเชื่อมต่อกับ Backend ที่รันใน Docker Container
// สำหรับ Web Browser: ใช้ localhost:8000
// สำหรับ Mobile (Expo Go): ใช้ IP address ของเครื่อง (เช่น http://192.168.1.100:8000)
// ตรวจสอบ IP address ด้วย: ipconfig (Windows) หรือ ifconfig (Mac/Linux)

// สำหรับ Web Browser
const API_BASE_URL_WEB = 'http://localhost:8000';

// สำหรับ Mobile - เปลี่ยนเป็น IP address ของเครื่องที่รัน Docker
// ตัวอย่าง: 'http://192.168.1.100:8000'
// วิธีหา IP: รันคำสั่ง ipconfig (Windows) หรือ ifconfig (Mac/Linux)
const API_BASE_URL_MOBILE = 'http://localhost:8000'; // เปลี่ยนเป็น IP address ของเครื่อง

// ใช้ Platform เพื่อตรวจสอบว่าเป็น Web หรือ Mobile
const API_BASE_URL = Platform.OS === 'web' ? API_BASE_URL_WEB : API_BASE_URL_MOBILE;

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
  
  // Transactions
  BORROW: `${API_BASE_URL}/transactions/borrow`,
  RETURN: `${API_BASE_URL}/transactions/return`,
  USER_HISTORY: (userId) => `${API_BASE_URL}/transactions/user/${userId}`,
};

export default API_BASE_URL;
