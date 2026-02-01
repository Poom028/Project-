/**
 * ## AuthContext - Context สำหรับจัดการ Authentication State
 * 
 * ไฟล์นี้จัดการ:
 * - เก็บ authentication state (isAuthenticated, user, isLoading)
 * - ตรวจสอบ token เมื่อแอปเริ่มทำงาน
 * - ฟังก์ชัน login และ logout
 * - จัดการ token และ user data ใน AsyncStorage
 * 
 * ใช้ React Context เพื่อให้ทุก component เข้าถึง authentication state ได้
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

// สร้าง AuthContext - Context สำหรับเก็บ authentication state
const AuthContext = createContext({});

// AuthProvider - Provider component ที่ wrap แอปทั้งหมด
// ให้ทุก component เข้าถึง authentication state ผ่าน useAuth hook
export const AuthProvider = ({ children }) => {
  // State Variables - ตัวแปร state สำหรับเก็บ authentication data
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // สถานะว่า login อยู่หรือไม่
  const [user, setUser] = useState(null);  // ข้อมูลผู้ใช้ปัจจุบัน
  const [isLoading, setIsLoading] = useState(true);  // สถานะว่ากำลังตรวจสอบ authentication หรือไม่

  // useEffect - ตรวจสอบ authentication เมื่อ component mount
  // ใช้สำหรับตรวจสอบว่า token ยังใช้ได้หรือไม่เมื่อแอปเริ่มทำงาน
  useEffect(() => {
    checkAuth();
  }, []);

  // checkAuth - ฟังก์ชันตรวจสอบ authentication
  // ดึง token จาก AsyncStorage และตรวจสอบว่ายังใช้ได้หรือไม่
  const checkAuth = async () => {
    try {
      // ดึง token จาก AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // ถ้ามี token ให้เรียก API เพื่อดึงข้อมูลผู้ใช้
        // ถ้า token ยังใช้ได้จะได้ข้อมูลผู้ใช้กลับมา
        const userInfo = await authAPI.getMe();
        setUser(userInfo);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // ถ้า token หมดอายุหรือไม่ถูกต้อง ให้ลบ token และ user data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      // ไม่ว่าจะสำเร็จหรือไม่ ให้ตั้ง isLoading เป็น false
      setIsLoading(false);
    }
  };

  // login - ฟังก์ชันเข้าสู่ระบบ
  // รับ username และ password แล้วเรียก API เพื่อ login
  // ถ้าสำเร็จจะเก็บ token และ user data ใน AsyncStorage
  const login = async (username, password) => {
    // เรียก API เพื่อ login และรับ token กลับมา
    const response = await authAPI.login(username, password);
    // เก็บ token ใน AsyncStorage
    await AsyncStorage.setItem('token', response.access_token);
    // เรียก API เพื่อดึงข้อมูลผู้ใช้
    const userInfo = await authAPI.getMe();
    // เก็บ user data ใน AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify(userInfo));
    // อัปเดต state
    setUser(userInfo);
    setIsAuthenticated(true);
    return response;
  };

  // logout - ฟังก์ชันออกจากระบบ
  // ลบ token และ user data จาก AsyncStorage และอัปเดต state
  const logout = async () => {
    console.log('=== AUTHCONTEXT LOGOUT START ===');
    try {
      console.log('AuthContext: Removing tokens from storage...');
      // ลบ token และ user data จาก AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.log('AuthContext: Tokens removed successfully');
    } catch (error) {
      console.error('AuthContext: Error removing storage:', error);
    }
    console.log('AuthContext: Setting isAuthenticated to false');
    // อัปเดต state
    setIsAuthenticated(false);
    setUser(null);
    console.log('AuthContext: State updated - isAuthenticated = false');
    console.log('=== AUTHCONTEXT LOGOUT END ===');
  };

  // Return AuthContext.Provider - ให้ทุก component เข้าถึง authentication state
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,  // สถานะว่า login อยู่หรือไม่
        user,  // ข้อมูลผู้ใช้ปัจจุบัน
        isLoading,  // สถานะว่ากำลังตรวจสอบ authentication หรือไม่
        login,  // ฟังก์ชัน login
        logout,  // ฟังก์ชัน logout
        checkAuth,  // ฟังก์ชันตรวจสอบ authentication
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// useAuth - Custom hook สำหรับเข้าถึง authentication state
// ใช้ใน component อื่นๆ เพื่อเข้าถึง isAuthenticated, user, login, logout, etc.
export const useAuth = () => useContext(AuthContext);
