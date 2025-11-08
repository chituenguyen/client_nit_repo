import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { useAuthStore } from '../stores/authStore';
import { type StudentRegisterData, type LecturerRegisterData } from '../api/api';

import {
  loginService,
  logoutService,
  registerService,
  getCurrentUserService
} from '../api/authApi';

// === CURRENT USER ===
export const useCurrentUser = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: async () => {
      const user = await getCurrentUserService();
      setUser(user); // Sync vào store
      return user;
    },
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

// === LOGIN ===
export const useLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginService(email, password),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.currentUser, user);
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};
// === LOGOUT ===
export const useLogout = () => {
  const clearUser = useAuthStore((s) => s.clearUser);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await logoutService();
    },
    onSuccess: () => {
      clearUser();
      queryClient.clear();
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

// === REGISTER ===
export const useRegister = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      role,
      data,
    }: {
      role: 'student' | 'lecturer';
      data: StudentRegisterData | LecturerRegisterData;
    }) => registerService(role, data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.currentUser, user);
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};