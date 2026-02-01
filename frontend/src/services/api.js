import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_ENDPOINTS.BOOKS.replace('/books', ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      console.log('Token present:', token.substring(0, 20) + '...');
    } else {
      console.warn('API Request without token:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('API: 401 Unauthorized - Removing tokens');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Note: Navigation will be handled by AuthContext's useEffect
    }
    return Promise.reject(error);
  }
);

// Books API
export const booksAPI = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.BOOKS);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.BOOK_BY_ID(id));
    return response.data;
  },
  
  create: async (bookData) => {
    const response = await api.post(API_ENDPOINTS.BOOKS, bookData);
    return response.data;
  },
  
  update: async (id, bookData) => {
    const response = await api.put(API_ENDPOINTS.BOOK_BY_ID(id), bookData);
    return response.data;
  },
  
  delete: async (id) => {
    console.log('booksAPI.delete called with ID:', id);
    console.log('Delete URL:', API_ENDPOINTS.BOOK_BY_ID(id));
    const response = await api.delete(API_ENDPOINTS.BOOK_BY_ID(id));
    console.log('Delete response:', response.status, response.data);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  create: async (userData) => {
    const response = await api.post(API_ENDPOINTS.USERS, userData);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.USER_BY_ID(id));
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getAllUsers: async () => {
    const response = await api.get(API_ENDPOINTS.ADMIN_USERS);
    return response.data;
  },
  
  getUserById: async (id) => {
    const response = await api.get(API_ENDPOINTS.ADMIN_USER_BY_ID(id));
    return response.data;
  },
  
  updateUserRole: async (userId, newRole) => {
    const response = await api.put(API_ENDPOINTS.ADMIN_UPDATE_USER_ROLE(userId, newRole));
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(API_ENDPOINTS.ADMIN_DELETE_USER(userId));
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get(API_ENDPOINTS.ADMIN_STATS);
    return response.data;
  },
  getAllTransactions: async () => {
    const response = await api.get(API_ENDPOINTS.ADMIN_TRANSACTIONS);
    return response.data;
  },
  getTransactionById: async (transactionId) => {
    const response = await api.get(API_ENDPOINTS.ADMIN_TRANSACTION_BY_ID(transactionId));
    return response.data;
  },
  approveBorrow: async (transactionId) => {
    const response = await api.post(API_ENDPOINTS.ADMIN_APPROVE_BORROW(transactionId));
    return response.data;
  },
  approveReturn: async (transactionId) => {
    const response = await api.post(API_ENDPOINTS.ADMIN_APPROVE_RETURN(transactionId));
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
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
  
  return: async (userId, bookId) => {
    const response = await api.post(API_ENDPOINTS.RETURN, {
      user_id: userId,
      book_id: bookId,
    });
    return response.data;
  },
  
  getUserHistory: async (userId) => {
    const response = await api.get(API_ENDPOINTS.USER_HISTORY(userId));
    return response.data;
  },
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },
  
  login: async (username, password) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      username,
      password,
    });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get(API_ENDPOINTS.ME);
    return response.data;
  },
};

export default api;
