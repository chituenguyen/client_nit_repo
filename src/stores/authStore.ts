import { create } from 'zustand';
import type { User } from '../types';
import { getCurrentUserService, logoutService } from '../api/authApi';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  
  setUser: (user) => set({ user }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  clearUser: () => set({ user: null }),
  
  logout: async () => {
    try {
      await logoutService();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      set({ user: null });
    }
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return null;
    }

    set({ isLoading: true });
    try {
      const user = await getCurrentUserService();
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      console.error('Auth check failed:', error);
      // Xóa cả refreshToken khi check auth thất bại
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isLoading: false });
      return null;
    }
  },
}));