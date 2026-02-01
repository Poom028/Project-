import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const api = axios.create({
  baseURL: API_ENDPOINTS.BOOKS.replace('/books', ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await api.delete(API_ENDPOINTS.BOOK_BY_ID(id));
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

// Transactions API
export const transactionsAPI = {
  borrow: async (userId, bookId) => {
    const response = await api.post(API_ENDPOINTS.BORROW, {
      user_id: userId,
      book_id: bookId,
    });
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

export default api;
