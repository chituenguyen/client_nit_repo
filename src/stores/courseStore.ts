// src/stores/courseStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type Course, type Enrollment } from '../api/courseApi';

interface CourseStore {
  // State
  courses: Course[];
  selectedCourse: Course | null;
  enrollments: Enrollment[];
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  totalCourses: number;
  currentPage: number;
  pageLimit: number;

  // Actions
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  setEnrollments: (enrollments: Enrollment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (total: number, page: number, limit: number) => void;
  reset: () => void;
  resetError: () => void;
}

const initialState = {
  courses: [],
  selectedCourse: null,
  enrollments: [],
  isLoading: false,
  error: null,
  totalCourses: 0,
  currentPage: 1,
  pageLimit: 10,
};

export const useCourseStore = create<CourseStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Set danh sách khóa học
      setCourses: (courses) => 
        set({ courses, error: null }, false, 'setCourses'),

      // Set khóa học được chọn
      setSelectedCourse: (course) => 
        set({ selectedCourse: course }, false, 'setSelectedCourse'),

      // Set danh sách enrollments
      setEnrollments: (enrollments) => {
        set({ enrollments, error: null }, false, 'setEnrollments');
      },
      // Set loading state
      setLoading: (isLoading) => 
        set({ isLoading }, false, 'setLoading'),

      // Set error
      setError: (error) => 
        set({ error, isLoading: false }, false, 'setError'),

      // Set pagination
      setPagination: (total, page, limit) =>
        set(
          {
            totalCourses: total,
            currentPage: page,
            pageLimit: limit,
          },
          false,
          'setPagination'
        ),

      // Reset toàn bộ store
      reset: () => 
        set(initialState, false, 'reset'),

      // Reset lỗi
      resetError: () => 
        set({ error: null }, false, 'resetError'),
    }),
    { name: 'CourseStore' }
  )
);

// Selectors để dễ dàng lấy state
export const selectCourses = (state: CourseStore) => state.courses;
export const selectSelectedCourse = (state: CourseStore) => state.selectedCourse;
export const selectEnrollments = (state: CourseStore) => state.enrollments;
export const selectIsLoading = (state: CourseStore) => state.isLoading;
export const selectError = (state: CourseStore) => state.error;
export const selectPagination = (state: CourseStore) => ({
  total: state.totalCourses,
  page: state.currentPage,
  limit: state.pageLimit,
});