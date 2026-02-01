/**
 * ## API Service - บริการสำหรับเรียก API ทั้งหมด
 * 
 * ไฟล์นี้จัดการ:
 * - สร้าง axios instance พร้อม configuration
 * - เพิ่ม JWT token อัตโนมัติในทุก request
 * - จัดการ error responses (เช่น 401 Unauthorized)
 * - สร้าง API functions สำหรับ Books, Users, Admin, Transactions, และ Auth
 */

import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Axios Instance Configuration - ตั้งค่า Axios
// ============================================

// สร้าง axios instance พร้อม base URL และ timeout
// baseURL จะถูกดึงจาก API_ENDPOINTS.BOOKS และลบ '/books' ออก
const api = axios.create({
  baseURL: API_ENDPOINTS.BOOKS.replace('/books', ''),  // เช่น http://localhost:8000
  timeout: 10000,  // หมดเวลา 10 วินาที
  headers: {
    'Content-Type': 'application/json',  // กำหนดว่าใช้ JSON format
  },
});

// ============================================
// Request Interceptor - เพิ่ม Token อัตโนมัติ
// ============================================

// Interceptor นี้จะทำงานก่อนส่ง request ทุกครั้ง
// ใช้สำหรับเพิ่ม JWT token ใน Authorization header อัตโนมัติ
api.interceptors.request.use(
  async (config) => {
    // ดึง token จาก AsyncStorage (เก็บไว้ใน local storage)
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // เพิ่ม token ใน Authorization header
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      console.log('Token present:', token.substring(0, 20) + '...');
    } else {
      // ถ้าไม่มี token จะแสดง warning (บาง endpoints ไม่ต้องการ token)
      console.warn('API Request without token:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor - จัดการ Error Responses
// ============================================

// Interceptor นี้จะทำงานหลังจากได้รับ response
// ใช้สำหรับจัดการ error responses (เช่น 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,  // ถ้าสำเร็จให้ส่ง response ต่อไป
  async (error) => {
    // ถ้าได้รับ 401 Unauthorized (token หมดอายุหรือไม่ถูกต้อง)
    if (error.response?.status === 401) {
      console.log('API: 401 Unauthorized - Removing tokens');
      // ลบ token และ user data จาก AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // หมายเหตุ: Navigation ไปหน้า Login จะถูกจัดการโดย AuthContext's useEffect
    }
    return Promise.reject(error);
  }
);

// ============================================
// Books API - ฟังก์ชันสำหรับจัดการหนังสือ
// ============================================

export const booksAPI = {
  // getAll - ดึงรายการหนังสือทั้งหมด
  // Public endpoint - ไม่ต้อง login ก็ดูได้
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.BOOKS);
    return response.data;
  },
  
  // getById - ดึงข้อมูลหนังสือตาม ID
  // Public endpoint - ไม่ต้อง login ก็ดูได้
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.BOOK_BY_ID(id));
    return response.data;
  },
  
  // create - สร้างหนังสือใหม่
  // Admin only - ต้อง login เป็น Admin
  create: async (bookData) => {
    const response = await api.post(API_ENDPOINTS.BOOKS, bookData);
    return response.data;
  },
  
  // update - แก้ไขข้อมูลหนังสือ
  // Admin only - ต้อง login เป็น Admin
  update: async (id, bookData) => {
    const response = await api.put(API_ENDPOINTS.BOOK_BY_ID(id), bookData);
    return response.data;
  },
  
  // delete - ลบหนังสือ
  // Admin only - ต้อง login เป็น Admin
  delete: async (id) => {
    console.log('booksAPI.delete called with ID:', id);
    console.log('Delete URL:', API_ENDPOINTS.BOOK_BY_ID(id));
    const response = await api.delete(API_ENDPOINTS.BOOK_BY_ID(id));
    console.log('Delete response:', response.status, response.data);
    return response.data;
  },
};

// ============================================
// Users API - ฟังก์ชันสำหรับจัดการผู้ใช้
// ============================================

export const usersAPI = {
  // create - สร้างผู้ใช้ใหม่
  // Public endpoint - ใช้สำหรับสมัครสมาชิก
  create: async (userData) => {
    const response = await api.post(API_ENDPOINTS.USERS, userData);
    return response.data;
  },
  
  // getById - ดึงข้อมูลผู้ใช้ตาม ID
  // Protected endpoint - ต้อง login
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.USER_BY_ID(id));
    return response.data;
  },
};

// ============================================
// Admin API - ฟังก์ชันสำหรับ Admin เท่านั้น
// ============================================

export const adminAPI = {
  // getAllUsers - ดึงรายการผู้ใช้ทั้งหมด
  // Admin only - ใช้ในหน้า UsersScreen
  getAllUsers: async () => {
    const response = await api.get(API_ENDPOINTS.ADMIN_USERS);
    return response.data;
  },
  
  // getUserById - ดึงข้อมูลผู้ใช้ตาม ID
  // Admin only
  getUserById: async (id) => {
    const response = await api.get(API_ENDPOINTS.ADMIN_USER_BY_ID(id));
    return response.data;
  },
  
  // updateUserRole - แก้ไขบทบาทผู้ใช้ (user <-> admin)
  // Admin only - ใช้ในหน้า UsersScreen
  updateUserRole: async (userId, newRole) => {
    const response = await api.put(API_ENDPOINTS.ADMIN_UPDATE_USER_ROLE(userId, newRole));
    return response.data;
  },
  
  // deleteUser - ลบผู้ใช้
  // Admin only - ใช้ในหน้า UsersScreen
  deleteUser: async (userId) => {
    const response = await api.delete(API_ENDPOINTS.ADMIN_DELETE_USER(userId));
    return response.data;
  },
  
  // getStats - ดึงสถิติระบบ
  // Admin only - ใช้ในหน้า HomeScreen (Admin)
  getStats: async () => {
    const response = await api.get(API_ENDPOINTS.ADMIN_STATS);
    return response.data;
  },
  
  // getAllTransactions - ดึงรายการ transactions ทั้งหมด
  // Admin only - ใช้ในหน้า TransactionsScreen
  getAllTransactions: async () => {
    const response = await api.get(API_ENDPOINTS.ADMIN_TRANSACTIONS);
    return response.data;
  },
  
  // getTransactionById - ดึงข้อมูล transaction ตาม ID
  // Admin only
  getTransactionById: async (transactionId) => {
    const response = await api.get(API_ENDPOINTS.ADMIN_TRANSACTION_BY_ID(transactionId));
    return response.data;
  },
  
  // approveBorrow - อนุมัติการยืมหนังสือ
  // Admin only - ใช้เมื่อ Admin กดปุ่ม "อนุมัติ" ในหน้า TransactionsScreen
  approveBorrow: async (transactionId) => {
    const response = await api.post(API_ENDPOINTS.ADMIN_APPROVE_BORROW(transactionId));
    return response.data;
  },
  
  // approveReturn - อนุมัติการคืนหนังสือ
  // Admin only - ใช้เมื่อ Admin กดปุ่ม "อนุมัติการคืน" ในหน้า TransactionsScreen
  approveReturn: async (transactionId) => {
    const response = await api.post(API_ENDPOINTS.ADMIN_APPROVE_RETURN(transactionId));
    return response.data;
  },
};

// ============================================
// Transactions API - ฟังก์ชันสำหรับการยืม-คืน
// ============================================

export const transactionsAPI = {
  // borrow - ยืมหนังสือ
  // Protected endpoint - ต้อง login
  // สร้าง transaction แบบ "Pending" (รอ Admin อนุมัติ)
  borrow: async (userId, bookId) => {
    console.log('transactionsAPI.borrow called with:', { userId, bookId });
    console.log('Borrow URL:', API_ENDPOINTS.BORROW);
    const response = await api.post(API_ENDPOINTS.BORROW, {
      user_id: userId,
      book_id: bookId,
    });
    console.log('Borrow response:', response.status, response.data);
    return response.data;
  },
  
  // return - คืนหนังสือ
  // Protected endpoint - ต้อง login
  // เปลี่ยน status เป็น "PendingReturn" (รอ Admin อนุมัติ)
  return: async (userId, bookId) => {
    const response = await api.post(API_ENDPOINTS.RETURN, {
      user_id: userId,
      book_id: bookId,
    });
    return response.data;
  },
  
  // getUserHistory - ดูประวัติการยืม-คืนของผู้ใช้
  // Protected endpoint - ต้อง login
  // ผู้ใช้สามารถดูประวัติของตัวเองเท่านั้น (ยกเว้น Admin)
  getUserHistory: async (userId) => {
    const response = await api.get(API_ENDPOINTS.USER_HISTORY(userId));
    return response.data;
  },
};

// ============================================
// Auth API - ฟังก์ชันสำหรับการยืนยันตัวตน
// ============================================

export const authAPI = {
  // register - สมัครสมาชิก
  // Public endpoint - ไม่ต้อง login
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },
  
  // login - เข้าสู่ระบบ
  // Public endpoint - ไม่ต้อง login
  // ส่ง username และ password แล้วได้รับ JWT token กลับมา
  login: async (username, password) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      username,
      password,
    });
    return response.data;
  },
  
  // getMe - ดึงข้อมูลผู้ใช้ปัจจุบัน
  // Protected endpoint - ต้อง login และส่ง token
  // ใช้สำหรับตรวจสอบว่า login อยู่หรือไม่ และดึงข้อมูลผู้ใช้
  getMe: async () => {
    const response = await api.get(API_ENDPOINTS.ME);
    return response.data;
  },
};

export default api;
