// src/api/courseApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';

// ==================== TYPES ====================

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Lecturer {
  id: string;
  userId: string;
  lecturerCode: string;
  department: string;
  title: string;
  bio: string;
  user: User;
}

export interface ScheduleCount {
  enrollments: number;
}

export interface Schedule {
  id: string;
  courseId: string;
  semester: string;
  academicYear: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
  totalWeeks: number;
  _count: ScheduleCount;
}

export interface CourseCount {
  assignments: number;
  lectureMaterials: number;
  schedules?: number;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  description: string | null;
  thumbnailUrl: string | null;
  credits: number;
  lecturerId: string;
  maxStudents: number;
  createdAt: string;
  updatedAt: string;
  
  lecturer: Lecturer;
  schedules: Schedule[];
  _count: CourseCount; 
}

// ==================== API PARAMS & RESPONSES ====================

export interface CoursesParams {
  search?: string;
  lecturerId?: string;
  page?: number;
  limit?: number;
}

export interface CoursesResponse {
  success: boolean;
  data: Course[] | { items: Course[]; total: number; page: number; limit: number };
  message?: string;
}

export interface CourseDetailResponse {
  success: boolean;
  data: Course;
  message?: string;
}

// Response cho enrollment
export interface EnrollmentResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    scheduleId: string;
    studentId: string;
    enrolledAt: string;
  };
}

// Response cho unenroll
export interface UnenrollResponse {
  success: boolean;
  message: string;
}

// Enrollment với thông tin đầy đủ
export interface Enrollment {
  id: string;
  studentId: string;
  scheduleId: string;
  enrollmentDate: string;
  status: 'ENROLLED';
  schedule: {
    id: string;
    courseId: string;
    semester: string;
    academicYear: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
    course: Course;
  };
}

export interface MyEnrollmentsResponse {
  success: boolean;
  data: Enrollment[];
  message?: string;
}

// ==================== API METHODS ====================

export const courseApi = {
  /**
   * Lấy danh sách khóa học với filter và pagination
   */
  getCourses: async (params?: CoursesParams): Promise<AxiosResponse<CoursesResponse>> => {
    return api.get('/courses', { params });
  },

  /**
   * Lấy chi tiết khóa học theo ID/Code
   */
  getCourseByCode: async (id: string): Promise<AxiosResponse<CourseDetailResponse>> => {
    if (!id) {
      throw new Error('Course ID/Code is required');
    }
    return api.get(`/courses/${id}`);
  },

  /**
   * Đăng ký khóa học theo schedule cụ thể
   * @param scheduleId - ID của schedule muốn đăng ký
   */
  enrollCourse: async (scheduleId: string): Promise<AxiosResponse<EnrollmentResponse>> => {
    if (!scheduleId) {
      throw new Error('Schedule ID is required');
    }
    return api.post('/enrollments', { scheduleId });
  },

  /**
   * Hủy đăng ký khóa học theo schedule ID
   * @param scheduleId - ID của schedule muốn hủy đăng ký
   */
  unenrollCourse: async (scheduleId: string): Promise<AxiosResponse<UnenrollResponse>> => {
    if (!scheduleId) {
      throw new Error('Schedule ID is required');
    }
    return api.delete(`/enrollments/${scheduleId}/drop`);
  },

  /**
   * Lấy danh sách các khóa học đã đăng ký của sinh viên
   */
  getMyEnrollments: async (status: string): Promise<AxiosResponse<MyEnrollmentsResponse>> => {
    return api.get('/enrollments/my-enrollments', {params: { status }});
  },
};

export default courseApi;