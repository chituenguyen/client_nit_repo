// src/hooks/useCourseQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, type CoursesParams, type Enrollment} from '../api/courseApi';
import { useCourseStore } from '../stores/courseStore';
import { AxiosError } from 'axios';

// ==================== QUERY KEYS ====================
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: CoursesParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (courseCode: string) => [...courseKeys.details(), courseCode] as const,
};

// ==================== UTILITY FUNCTION ====================
const parseCourseResponse = (res: any) => {
  if (res.data?.data) {
    if (Array.isArray(res.data.data)) {
      return { courses: res.data.data, total: res.data.data.length };
    }
    if (res.data.data.items && Array.isArray(res.data.data.items)) {
      return {
        courses: res.data.data.items,
        total: res.data.data.total || res.data.data.items.length,
        page: res.data.data.page,
        limit: res.data.data.limit,
      };
    }
  }
  
  if (res.data && Array.isArray(res.data)) {
    return { courses: res.data, total: res.data.length };
  }
  
  if (res.data?.items && Array.isArray(res.data.items)) {
    return {
      courses: res.data.items,
      total: res.data.total || res.data.items.length,
    };
  }

  console.warn('Unknown API response format:', res.data);
  return { courses: [], total: 0 };
};

// ==================== HOOKS ====================

/**
 * Hook để lấy danh sách khóa học với filter và pagination
 */
export const useCourses = (params?: CoursesParams) => {
  const setCourses = useCourseStore((s) => s.setCourses);
  const setLoading = useCourseStore((s) => s.setLoading);
  const setError = useCourseStore((s) => s.setError);
  const setPagination = useCourseStore((s) => s.setPagination);


  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await courseApi.getCourses(params);
        
        const { courses, total, page, limit } = parseCourseResponse(response);
        
        setCourses(courses);
        if (total !== undefined) {
          setPagination(
            total,
            page || params?.page || 1,
            limit || params?.limit || 10
          );
        }
        setError(null);
        
        return courses;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage = error.response?.data?.message || 'Không thể tải danh sách khóa học';
        
        console.error('❌ Lỗi khi tải khóa học:', {
          status: error.response?.status,
          message: errorMessage,
          params,
        });
        
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook để lấy chi tiết khóa học theo courseCode
 */
export const useCourseDetail = (id: string | undefined) => {
  const setSelectedCourse = useCourseStore((s) => s.setSelectedCourse);
  const setLoading = useCourseStore((s) => s.setLoading);
  const setError = useCourseStore((s) => s.setError);

  return useQuery({
    queryKey: courseKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Course code is required');
      
      try {
        setLoading(true);
        const response = await courseApi.getCourseByCode(id);
        const course = response.data?.data || response.data;
        
        setSelectedCourse(course);
        setError(null);
        
        return course;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage = error.response?.data?.message || 'Không thể tải chi tiết khóa học';
        
        console.error('❌ Lỗi khi tải chi tiết khóa học:', {
          id,
          status: error.response?.status,
          message: errorMessage,
        });
        
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Hook đăng ký khóa học theo schedule ID
 */
export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  const { setError } = useCourseStore();

  return useMutation({
    mutationFn: (scheduleId: string) => courseApi.enrollCourse(scheduleId),
    onSuccess: (response) => {
      // Invalidate tất cả các queries liên quan để refetch data mới
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.details() });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      
      console.log('✅ Đăng ký khóa học thành công:', response.data);
    },
    onError: (err) => {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage = error.response?.data?.message || 'Không thể đăng ký khóa học';
      
      console.error('❌ Lỗi khi đăng ký khóa học:', error);
      setError(errorMessage);
    },
  });
};

/**
 * Hook hủy đăng ký khóa học theo schedule ID
 */
export const useUnenrollCourse = () => {
  const queryClient = useQueryClient();
  const { setError } = useCourseStore();

  return useMutation({
    mutationFn: (scheduleId: string) => courseApi.unenrollCourse(scheduleId),
    onSuccess: (response) => {
      // Invalidate tất cả các queries liên quan để refetch data mới
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.details() });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      
      console.log('✅ Hủy đăng ký khóa học thành công:', response.data);
    },
    onError: (err) => {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage = error.response?.data?.message || 'Không thể hủy đăng ký khóa học';
      
      console.error('❌ Lỗi khi hủy đăng ký khóa học:', error);
      setError(errorMessage);
    },
  });
};

/**
 * Hook để lấy danh sách các khóa học đã đăng ký
 */
type EnrollmentStatus = 'ENROLLED' | 'DROPPED' | 'COMPLETED';

export const useMyEnrollments = (status: EnrollmentStatus) => {
  const setEnrollments = useCourseStore((s) => s.setEnrollments);
  const setLoading = useCourseStore((s) => s.setLoading);
  const setError = useCourseStore((s) => s.setError);

  return useQuery({
    queryKey: ['enrollments', 'my-enrollments', status],
    queryFn: async () => {
      try {
        setLoading(true);

        const response = await courseApi.getMyEnrollments(status);

        // ✅ Lấy đúng dữ liệu: có thể là data.data hoặc data
        const enrollments =
          (Array.isArray(response.data?.data)
            ? response.data.data
            : Array.isArray(response.data)
            ? response.data
            : []) as Enrollment[];

        setEnrollments(enrollments);
        setError(null);

        return enrollments;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage =
          error.response?.data?.message ||
          'Không thể tải danh sách khóa học đã đăng ký';

        console.error(`❌ Lỗi khi tải enrollments (Status: ${status}):`, {
          status: error.response?.status,
          message: errorMessage,
        });

        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};