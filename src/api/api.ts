// src/pages/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (!API_URL) {
  throw new Error('Missing VITE_API_BASE_URL. Cấu hình trong .env.[mode]');
}

// Tạo axios instance dùng chung cho mọi API
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor thêm token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// ==================== AUTH API ====================
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

export default api;


// ==================== TYPES ====================
export type StudentRegisterData = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentCode: string;
  major?: string;
  enrollmentYear?: number;
  className?: string;
};

export type LecturerRegisterData = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  lecturerCode: string;
  department?: string;
  title:
    | 'TA'
    | 'LECTURER'
    | 'SENIOR_LECTURER'
    | 'ASSOCIATE_PROFESSOR'
    | 'PROFESSOR';
  bio?: string;
};
