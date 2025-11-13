import { create } from 'zustand';
import { authApi, type StudentRegisterData, type LecturerRegisterData } from '../api/api';
// Import từ types.ts
import type { User } from '../types';
import { UserRole, normalizeRole } from '../types';

interface AuthStore {
    // State
    user: User | null;
    isLoading: boolean;
    
    // Computed (getters)
    isAuthenticated: boolean;
    isStudent: boolean;
    isLecturer: boolean;
    
    // Actions
    login: (email: string, password: string) => Promise<{success: boolean, message: string}>;
    logout: () => void;
    setUser: (user: User | null) => void;
    checkAuth: () => Promise<void>;
    register: (
        role: 'student' | 'lecturer', 
        data: StudentRegisterData | LecturerRegisterData
    ) => Promise<{success: boolean, message: string}>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    // State khởi tạo
    user: null,
    isLoading: true,
    
    // Computed values
    get isAuthenticated() {
        return !!get().user;
    },
    get isStudent() {
        return get().user?.role === UserRole.STUDENT;
    },
    get isLecturer() {
        return get().user?.role === UserRole.LECTURER;
    },
    
    login: async (email: string, password: string) => {
        try {
            const response = await authApi.login(email, password);
            
            if (response.data) {
                const { user, token } = response.data;
                
                // Normalize data từ backend (có thể là fullName hoặc full_name)
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
                
                set({ user: normalized, isLoading: false });
                localStorage.setItem('user', JSON.stringify({ id: normalized.id, role: normalized.role }));
                localStorage.setItem('token', token);
                
                return { success: true, message: "Đăng nhập thành công!" };
            }
            
            return { success: false, message: "Đăng nhập thất bại!" };
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || "Có lỗi xảy ra!";
            return { success: false, message };
        }
    },
    
    // Logout action
    logout: () => {
        set({ user: null });
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    },
    
    // Set user
    setUser: (user) => {
        set({ user, isLoading: false });
    },
    
    // Check authentication on app load
    checkAuth: async () => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
            try {
                const response = await authApi.getCurrentUser();
                if (response.data) {
                    const normalized: User = {
                        id: String(response.data.id),
                        email: response.data.email,
                        full_name: response.data.fullName || response.data.full_name || '',
                        avatar: response.data.avatar || `https://i.pravatar.cc/150?u=${response.data.email}`,
                        role: normalizeRole(response.data.role),
                        phone: response.data.phone,
                        createdAt: response.data.createdAt || new Date().toISOString(),
                        updatedAt: response.data.updatedAt
                    };
                    set({ user: normalized, isLoading: false });
                } else {
                    set({ user: null, isLoading: false });
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                set({ user: null, isLoading: false });
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        } else {
            set({ isLoading: false });
        }
    },
    
    // Register action
    register: async (
        role: 'student' | 'lecturer',
        data: StudentRegisterData | LecturerRegisterData
    ) => {
        try {
            let response;
            const { confirmPassword, enrollmentYear, title: rawTitle, className, major, studentCode, lecturerCode, department, bio, ...commonData } = data as any;

            if (role === 'student') {
                const studentData: StudentRegisterData = {
                    ...commonData,
                    studentCode,
                    major,
                    className,
                    enrollmentYear: enrollmentYear ? Number(enrollmentYear) : undefined
                };
                response = await authApi.registerStudent(studentData);
            } else {
                const lecturerData: LecturerRegisterData = {
                    ...commonData,
                    lecturerCode,
                    department,
                    title: rawTitle,
                    bio,
                };
                response = await authApi.registerLecturer(lecturerData);
            }

            if (response.data) {
                const { user: userData, token } = response.data;
                
                const normalized: User = {
                    id: String(userData.id),
                    email: userData.email,
                    full_name: userData.fullName || userData.full_name || '',
                    avatar: userData.avatar || `https://i.pravatar.cc/150?u=${userData.email}`,
                    role: normalizeRole(userData.role),
                    phone: userData.phone,
                    createdAt: userData.createdAt || new Date().toISOString(),
                    updatedAt: userData.updatedAt
                };

                set({ user: normalized });
                localStorage.setItem('user', JSON.stringify({ id: normalized.id, role: normalized.role }));
                localStorage.setItem('token', token);

                return { success: true, message: "Đăng ký thành công!" };
            }
            return { success: false, message: "Đăng ký thất bại!" };
        } catch (error: any) {
            console.error('Register error:', error.response?.data);
            const message = error.response?.data?.message || 
                            error.response?.data?.error ||
                            "Có lỗi xảy ra khi đăng ký!";
            return { success: false, message };
        }
    }
}));