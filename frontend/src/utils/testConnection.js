/**
 * Utility function to test API connection
 * Useful for debugging mobile connection issues
 */

import { API_ENDPOINTS } from '../config/api';

export const testConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    console.log('   API Base URL:', API_ENDPOINTS.BOOKS.replace('/books', ''));
    
    const response = await fetch(API_ENDPOINTS.BOOKS.replace('/books', '/'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connection successful!');
      console.log('   Response:', data);
      return { success: true, message: 'เชื่อมต่อสำเร็จ', data };
    } else {
      console.error('❌ Connection failed:', response.status, response.statusText);
      return { 
        success: false, 
        message: `เชื่อมต่อล้มเหลว: ${response.status} ${response.statusText}`,
        status: response.status 
      };
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
    
    let errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
    
    if (error.message.includes('Network request failed')) {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\n\nกรุณาตรวจสอบ:\n1. IP address ถูกต้องหรือไม่\n2. Backend รันอยู่หรือไม่\n3. โทรศัพท์และคอมพิวเตอร์อยู่ใน WiFi เดียวกันหรือไม่';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'การเชื่อมต่อหมดเวลา\n\nกรุณาตรวจสอบ:\n1. Backend รันอยู่หรือไม่\n2. Firewall ไม่อุดกั้น port 8000';
    }
    
    return { 
      success: false, 
      message: errorMessage,
      error: error.message 
    };
  }
};
