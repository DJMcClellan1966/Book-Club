import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // You can navigate to login here if needed
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Books API
export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  search: (query) => api.get('/books/search', { params: { q: query } }),
};

// Reviews API
export const reviewsAPI = {
  getByBook: (bookId) => api.get(`/reviews/book/${bookId}`),
  create: (reviewData) => api.post('/reviews', reviewData),
  update: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Forums API
export const forumsAPI = {
  getAll: () => api.get('/forums'),
  getById: (id) => api.get(`/forums/${id}`),
  create: (forumData) => api.post('/forums', forumData),
  addPost: (forumId, postData) => api.post(`/forums/${forumId}/posts`, postData),
};

// Spaces API
export const spacesAPI = {
  getAll: () => api.get('/spaces'),
  getById: (id) => api.get(`/spaces/${id}`),
  create: (spaceData) => api.post('/spaces', spaceData),
  join: (id) => api.post(`/spaces/${id}/join`),
  leave: (id) => api.post(`/spaces/${id}/leave`),
};

// AI Chats API
export const aiChatsAPI = {
  getMyChats: () => api.get('/aichats/my-chats'),
  create: (chatData) => api.post('/aichats/create', chatData),
  sendMessage: (chatId, message) => api.post(`/aichats/${chatId}/message`, { message }),
  delete: (chatId) => api.delete(`/aichats/${chatId}`),
  getLimits: () => api.get('/aichats/limits/current'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getReadingList: () => api.get('/users/reading-list'),
  updateReadingList: (bookId, status) => api.put('/users/reading-list', { bookId, status }),
  getRecommendations: () => api.get('/users/recommendations'),
};

// Payments API
export const paymentsAPI = {
  getPricing: () => api.get('/payments/pricing'),
  getSubscription: () => api.get('/payments/subscription'),
  subscribe: (tier) => api.post('/payments/subscribe', { tier }),
  cancel: () => api.post('/payments/cancel'),
};

export default api;
