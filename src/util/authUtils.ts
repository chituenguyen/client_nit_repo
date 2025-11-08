// Định nghĩa hằng số cho Role
export const UserRole = {
  STUDENT: 1,
  LECTURER: 2
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Định nghĩa Interface cho User
export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar: string;
    role: UserRole;
    phone?: string;
    createdAt: string;
    updatedAt?: string;
    lecturerId?: string; // ID từ bảng LECTURER (khác với userId)
    studentId?: string;  // ID từ bảng STUDENT (khác với userId)
}

// Hàm tiện ích để chuẩn hóa role từ API
type ApiRole = string | number | null | undefined;
export const normalizeRole = (apiRole: ApiRole): UserRole => {
    if (
        apiRole === 2 || 
        apiRole === '2' || 
        apiRole === 'LECTURER' || 
        apiRole === 'lecturer' ||
        (typeof apiRole === 'string' && apiRole.toUpperCase() === 'LECTURER')
    ) {
        return UserRole.LECTURER;
    }
    return UserRole.STUDENT;
};