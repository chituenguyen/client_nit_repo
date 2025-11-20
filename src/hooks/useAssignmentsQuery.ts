// src/hooks/useAssignmentQuery.ts
import { useQuery } from '@tanstack/react-query';
import assignmentApi from '../api/assignmentApi';
import { useAssignmentStore } from '../stores/assignmentStore';
import { AxiosError } from 'axios';

// ==================== QUERY KEYS ====================
export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  listByCourse: (courseId: string) => [...assignmentKeys.lists(), courseId] as const,
  details: () => [...assignmentKeys.all, 'detail'] as const,
  detail: (assignmentId: string) => [...assignmentKeys.details(), assignmentId] as const,
};

// ==================== HOOKS ====================

/**
 * Hook để lấy danh sách assignments theo courseId
 */
export const useAssignmentsByCourse = (courseId: string | undefined) => {
  const setAssignments = useAssignmentStore((s) => s.setAssignments);
  const setLoading = useAssignmentStore((s) => s.setLoading);
  const setError = useAssignmentStore((s) => s.setError);

  return useQuery({
    queryKey: assignmentKeys.listByCourse(courseId || ''),
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');

      try {
        setLoading(true);
        const response = await assignmentApi.getAssignmentsByCourse(courseId);
        
        // Parse response - có thể là data.data hoặc data
        const assignments = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setAssignments(assignments);
        setError(null);

        return assignments;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage =
          error.response?.data?.message || 'Không thể tải danh sách assignments';

        console.error('❌ Lỗi khi tải assignments:', {
          courseId,
          status: error.response?.status,
          message: errorMessage,
        });

        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Hook để lấy chi tiết assignment theo ID
 */
export const useAssignmentDetail = (assignmentId: string | undefined) => {
  const setSelectedAssignment = useAssignmentStore((s) => s.setSelectedAssignment);
  const setLoading = useAssignmentStore((s) => s.setLoading);
  const setError = useAssignmentStore((s) => s.setError);

  return useQuery({
    queryKey: assignmentKeys.detail(assignmentId || ''),
    queryFn: async () => {
      if (!assignmentId) throw new Error('Assignment ID is required');

      try {
        setLoading(true);
        const response = await assignmentApi.getAssignmentById(assignmentId);
        const assignment = response.data?.data || response.data;

        setSelectedAssignment(assignment);
        setError(null);

        return assignment;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage =
          error.response?.data?.message || 'Không thể tải chi tiết assignment';

        console.error('❌ Lỗi khi tải chi tiết assignment:', {
          assignmentId,
          status: error.response?.status,
          message: errorMessage,
        });

        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!assignmentId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};