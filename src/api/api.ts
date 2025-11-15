import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (!API_URL) {
  throw new Error('Missing VITE_API_BASE_URL. Cấu hình trong .env.[mode]');
}

// Tạo axios instance dùng chung cho mọi API
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Extend AxiosRequestConfig to add _retry flag
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Biến để track trạng thái refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor thêm token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ CHỈ set Content-Type: application/json khi KHÔNG phải FormData
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Interceptor xử lý lỗi 401 và refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Nếu đang refresh, đợi trong hàng đợi
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // Không có refresh token, redirect về login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const response = await axios.post<RefreshTokenResponse>(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Lưu token mới
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Cập nhật header cho request gốc
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        if (api.defaults.headers.common) {
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        }

        // Xử lý các request đang chờ
        processQueue(null, accessToken);

        // Retry request gốc
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại, logout
        processQueue(
          refreshError instanceof Error ? refreshError : new Error('Refresh token failed'),
          null
        );
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  registerStudent: (data: StudentRegisterData) =>
    api.post<LoginResponse>('/auth/register/student', data),

  registerLecturer: (data: LecturerRegisterData) =>
    api.post<LoginResponse>('/auth/register/lecturer', data),

  getCurrentUser: () => api.get<LoginResponse['user']>('/auth/me'),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }),

  checkEmailExists: (email: string) =>
    api.get<{ exists: boolean }>(`/users?email=${email}`),
};

export default api;

// ==================== TYPES ====================

// API Response Types
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    student?: {
      id: string;
      userId: string;
      studentCode: string;
      major: string;
      enrollmentYear: number;
      className: string;
    } | null;
    lecturer?: {
      id: string;
      userId: string;
      lecturerCode: string;
      department: string;
      title: string;
      bio: string;
    } | null;
  };
  accessToken: string;
  refreshToken: string;
  token?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

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
