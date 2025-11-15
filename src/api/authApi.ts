import { authApi, type StudentRegisterData, type LecturerRegisterData, type LoginResponse } from './api';
import { type User, normalizeRole } from '../util/authUtils';

// Helper function to normalize user from API response
const normalizeUser = (apiUser: LoginResponse['user']): User => {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    full_name: apiUser.fullName,
    avatar: apiUser.avatarUrl || `https://i.pravatar.cc/150?u=${apiUser.email}`,
    role: normalizeRole(apiUser.role),
    phone: apiUser.phone || undefined,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
    studentId: apiUser.student?.id,
    lecturerId: apiUser.lecturer?.id,
  };
};

// === LOGIN ===
export const loginService = async (email: string, password: string): Promise<User> => {
  const res = await authApi.login(email, password);
  const { user, accessToken, refreshToken, token } = res.data;
  
  const authToken = accessToken || token;
  
  if (!authToken) {
    throw new Error('Token not found in response');
  }
  
  if (!user) {
    throw new Error('User not found in response');
  }

  const normalized = normalizeUser(user);

  // Lưu cả accessToken và refreshToken
  localStorage.setItem('token', authToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  localStorage.setItem('user', JSON.stringify({ id: normalized.id, role: normalized.role }));

  return normalized;
};

// === LOGOUT ===
export const logoutService = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch (err) {
    console.warn('Logout API call failed:', err);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

// === GET CURRENT USER ===
export const getCurrentUserService = async (): Promise<User> => {
  const res = await authApi.getCurrentUser();
  return normalizeUser(res.data);
};

// === REGISTER ===
export const registerService = async (
  role: 'student' | 'lecturer',
  data: StudentRegisterData | LecturerRegisterData
): Promise<User> => {
  const res = role === 'student' 
    ? await authApi.registerStudent(data as StudentRegisterData)
    : await authApi.registerLecturer(data as LecturerRegisterData);

  const { user, accessToken, refreshToken, token } = res.data;
  const authToken = accessToken || token;
  
  if (!authToken || !user) {
    throw new Error('Invalid register response');
  }

  const normalized = normalizeUser(user);

  // Lưu cả accessToken và refreshToken
  localStorage.setItem('token', authToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  localStorage.setItem('user', JSON.stringify({ id: normalized.id, role: normalized.role }));

  return normalized;
};

// === REFRESH TOKEN ===
export const refreshTokenService = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await authApi.refreshToken(refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = res.data;

  if (!accessToken) {
    throw new Error('Invalid refresh response');
  }

  // Cập nhật token mới
  localStorage.setItem('token', accessToken);
  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken);
  }

  return accessToken;
};