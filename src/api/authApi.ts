import { authApi, type StudentRegisterData, type LecturerRegisterData } from './api';
import { type User, normalizeRole } from '../util/authUtils';

// === LOGIN ===
export const loginService = async (email: string, password: string) => {
  const res = await authApi.login(email, password);
  
  // API trả về accessToken thay vì token
  const { user, accessToken, token } = res.data;
  const authToken = accessToken || token;
  
  if (!authToken) {
    throw new Error('Token not found in response');
  }
  
  if (!user) {
    throw new Error('User not found in response');
  }

  const normalized: User = {
    id: String(user.id),
    email: user.email,
    full_name: user.fullName || user.full_name || '',
    avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.email}`,
    role: normalizeRole(user.role),
    phone: user.phone,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt
  };

  localStorage.setItem('token', authToken);
  localStorage.setItem('user', JSON.stringify({ id: normalized.id, role: normalized.role }));

  return normalized;
};

// === LOGOUT ===
export const logoutService = async () => {
  // Try calling server logout if available, but don't fail if the endpoint doesn't exist
  try {
    if (authApi.logout) {
      await authApi.logout();
    }
  } catch (err) {
    // Log and continue — even if server logout fails, we'll clear local state
    console.warn('Logout API call failed:', err);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

};

// === GET CURRENT USER ===
export const getCurrentUserService = async () => {
  const res = await authApi.getCurrentUser();
  const user = res.data;

  const normalized: User = {
    id: String(user.id),
    email: user.email,
    full_name: user.fullName || user.full_name || '',
    avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.email}`,
    role: normalizeRole(user.role),
    phone: user.phone,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt
  };

  return normalized;
};

// === REGISTER ===
export const registerService = async (
  role: 'student' | 'lecturer',
  data: StudentRegisterData | LecturerRegisterData
) => {
  let res;
  if (role === 'student') {
    res = await authApi.registerStudent(data as StudentRegisterData);
  } else {
    res = await authApi.registerLecturer(data as LecturerRegisterData);
  }

  // API trả về accessToken thay vì token
  const { user, accessToken, token } = res.data;
  const authToken = accessToken || token;
  
  if (!authToken || !user) {
    throw new Error('Invalid register response');
  }

  const normalized: User = {
    id: String(user.id),
    email: user.email,
    full_name: user.fullName || user.full_name || '',
    avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.email}`,
    role: normalizeRole(user.role),
    phone: user.phone,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt
  };

  localStorage.setItem('token', authToken);
  localStorage.setItem('user', JSON.stringify({ id: normalized.id, role: normalized.role }));

  return normalized;
};