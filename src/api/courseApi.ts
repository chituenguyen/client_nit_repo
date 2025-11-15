// src/api/courseApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';
import type {
  CreateCourseData,
  CreateScheduleData,
  CoursesParams,
  CoursesResponse,
  CourseDetailResponse,
  EnrollmentResponse,
  UnenrollResponse,
  MyEnrollmentsResponse,
} from '../types';

// ==================== ADDITIONAL TYPES ====================

// Params cho Lecturer lấy courses
export type GetLecturerCoursesParams = CoursesParams;

// ==================== API METHODS ====================

export const courseApi = {
  // ==================== LECTURER METHODS ====================

  /**
   * Tạo course mới (Lecturer only)
   */
  createCourse: async (data: CreateCourseData, thumbnailFile?: File) => {
    if (thumbnailFile) {
      const formData = new FormData();
      // Gửi từng field riêng lẻ như string
      formData.append('courseCode', data.courseCode);
      formData.append('courseName', data.courseName);
      formData.append('description', data.description);
      formData.append('credits', data.credits.toString());
      formData.append('maxStudents', data.maxStudents.toString());
      formData.append('lecturerId', data.lecturerId);
      formData.append('thumbnail', thumbnailFile);

      return api.post('/courses', formData);
    }
    return api.post('/courses', data);
  },

  /**
   * Lấy danh sách courses của Lecturer (hỗ trợ tìm kiếm & phân trang)
   */
  getLecturerCourses: async (params?: GetLecturerCoursesParams) => {
    const queryParams: Record<string, string | number> = {};

    if (params?.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
    }

    if (typeof params?.page === 'number') {
      queryParams.page = params.page;
    }

    if (typeof params?.limit === 'number') {
      queryParams.limit = params.limit;
    }

    if (params?.lecturerId) {
      queryParams.lecturerId = params.lecturerId;
    }

    return api.get('/courses', { params: queryParams });
  },

  /**
   * Cập nhật course (Lecturer only)
   */
  updateCourse: async (
    courseId: string,
    data: Partial<CreateCourseData>,
    thumbnailFile?: File
  ) => {
    // Nếu có file → dùng FormData
    if (thumbnailFile) {
      const formData = new FormData();

      // Append từng field một cách rõ ràng
      if (data.courseCode !== undefined)
        formData.append('courseCode', data.courseCode);
      if (data.courseName !== undefined)
        formData.append('courseName', data.courseName);
      if (data.description !== undefined)
        formData.append('description', data.description);
      if (data.credits !== undefined)
        formData.append('credits', data.credits.toString());
      if (data.maxStudents !== undefined)
        formData.append('maxStudents', data.maxStudents.toString());
      if (data.lecturerId !== undefined)
        formData.append('lecturerId', data.lecturerId);

      formData.append('thumbnail', thumbnailFile);

      return api.patch(`/courses/${courseId}`, formData);
    }

    // Nếu không có file → dùng JSON bình thường
    return api.patch(`/courses/${courseId}`, data);
  },

  /**
   * Xóa course (Lecturer only)
   */
  deleteCourse: async (courseId: string) => {
    return api.delete(`/courses/${courseId}`);
  },

  // ==================== SCHEDULE METHODS (LECTURER) ====================

  /**
   * Thêm lịch học cho course
   */
  createSchedule: async (data: CreateScheduleData) => {
    return api.post('/schedules', data);
  },

  /**
   * Lấy lịch học theo course
   */
  getCourseSchedules: async (courseId: string) => {
    return api.get('/schedules', {
      params: {
        courseId,
        limit: 1000,
      },
    });
  },

  /**
   * Cập nhật lịch học
   */
  updateSchedule: async (
    scheduleId: string,
    data: Partial<CreateScheduleData>
  ) => {
    return api.patch(`/schedules/${scheduleId}`, data);
  },

  /**
   * Xóa lịch học
   */
  deleteSchedule: async (scheduleId: string) => {
    return api.delete(`/schedules/${scheduleId}`);
  },

  // ==================== STUDENT METHODS ====================

  /**
   * Lấy danh sách khóa học với filter và pagination (Public/Student)
   */
  getCourses: async (
    params?: CoursesParams
  ): Promise<AxiosResponse<CoursesResponse>> => {
    return api.get('/courses', { params });
  },

  /**
   * Lấy tất cả courses (public)
   */
  getAllCourses: async () => {
    return api.get('/courses');
  },

  /**
   * Lấy chi tiết khóa học theo ID/Code
   */
  getCourseByCode: async (
    id: string
  ): Promise<AxiosResponse<CourseDetailResponse>> => {
    if (!id) {
      throw new Error('Course ID/Code is required');
    }
    return api.get(`/courses/${id}`);
  },

  /**
   * Lấy chi tiết course (alias)
   */
  getCourseById: async (courseId: string) => {
    return api.get(`/courses/${courseId}`);
  },

  // ==================== ENROLLMENT METHODS (STUDENT) ====================

  /**
   * Đăng ký khóa học theo schedule cụ thể
   * @param scheduleId - ID của schedule muốn đăng ký
   */
  enrollCourse: async (
    scheduleId: string
  ): Promise<AxiosResponse<EnrollmentResponse>> => {
    if (!scheduleId) {
      throw new Error('Schedule ID is required');
    }
    return api.post('/enrollments', { scheduleId });
  },

  /**
   * Hủy đăng ký khóa học theo schedule ID
   * @param scheduleId - ID của schedule muốn hủy đăng ký
   */
  unenrollCourse: async (
    scheduleId: string
  ): Promise<AxiosResponse<UnenrollResponse>> => {
    if (!scheduleId) {
      throw new Error('Schedule ID is required');
    }
    return api.delete(`/enrollments/${scheduleId}/drop`);
  },

  /**
   * Lấy danh sách các khóa học đã đăng ký của sinh viên
   */
  getMyEnrollments: async (
    status: string
  ): Promise<AxiosResponse<MyEnrollmentsResponse>> => {
    return api.get('/enrollments/my-enrollments', { params: { status } });
  },
};

export default courseApi;