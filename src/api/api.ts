import axios from 'axios';
import type { StudentRegisterData, LecturerRegisterData } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if(!API_URL) {
  throw new Error('Missing VITE_API_BASE_URL. Cấu hình trong .env.[mode]');
}

// Tạo axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor để thêm token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Cho axios tự thay đổi header nếu là FormData (cần để axios tự thêm boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor để bắt lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token có thể đã hết hạn');
      // Có thể redirect về trang login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==== AUTH API ====
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  registerStudent: (data: StudentRegisterData) =>
    api.post('/auth/register/student', data),

  registerLecturer: (data: LecturerRegisterData) =>
    api.post('/auth/register/lecturer', data),

  getCurrentUser: () => api.get('/auth/me'),

  // Logout (optional) - backend may or may not support this endpoint
  logout: () => api.post('/auth/logout'),

  checkEmailExists: (email: string) =>
    api.get(`/users?email=${email}`),
};

// Re-export types để các file khác vẫn import được từ đây (tương thích ngược)
export type { StudentRegisterData, LecturerRegisterData };

export default api;

