// src/api/courseApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';

// ==================== TYPES ====================

import type { 
  CoursesParams,
  CoursesResponse,
  CourseDetailResponse,
  EnrollmentResponse,
  UnenrollResponse,
  MyEnrollmentsResponse,
} from '../types';

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