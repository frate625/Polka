import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Определяем URL в зависимости от того, откуда открыто
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Production (Vercel)
      if (hostname.includes('vercel.app')) {
        return 'https://polka-production.up.railway.app/api';
      }
      
      // Localhost
      if (hostname === 'localhost') {
        return 'http://localhost:3000/api';
      }
      
      // Локальная сеть (IP адрес)
      return 'http://10.0.1.9:3000/api';
    }
  }
  
  // Для мобильных устройств используем IP компьютера
  return 'http://10.0.1.9:3000/api';
};

// Базовый URL для файлов (без /api)
export const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Production (Vercel)
      if (hostname.includes('vercel.app')) {
        return 'https://polka-production.up.railway.app';
      }
      
      // Localhost
      if (hostname === 'localhost') {
        return 'http://localhost:3000';
      }
      
      // Локальная сеть (IP адрес)
      return 'http://10.0.1.9:3000';
    }
  }
  
  // Для мобильных устройств
  return 'http://10.0.1.9:3000';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout')
};

export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  searchUsers: (query) => api.get('/users/search', { params: { query } }),
  getUserById: (id) => api.get(`/users/${id}`)
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  createChat: (data) => api.post('/chats', data),
  createSavedMessages: () => api.post('/chats/saved-messages'),
  getChatById: (id) => api.get(`/chats/${id}`),
  updateChat: (id, data) => api.put(`/chats/${id}`, data),
  deleteChat: (id) => api.delete(`/chats/${id}`),
  addMember: (chatId, userId) => api.post(`/chats/${chatId}/members`, { user_id: userId }),
  removeMember: (chatId, userId) => api.delete(`/chats/${chatId}/members/${userId}`)
};

export const messageAPI = {
  getMessages: (chatId, params) => api.get(`/messages/chats/${chatId}/messages`, { params }),
  sendMessage: (chatId, data) => api.post(`/messages/chats/${chatId}/messages`, data),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`)
};

export const uploadAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || 'upload.jpg'
    });

    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  uploadWebFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default api;
