// src/hooks/useAssignmentQuery.ts
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { type Submission } from '../types';
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
  submissions: () => [...assignmentKeys.all, 'submission'] as const,
  mySubmissionsList: () => [...assignmentKeys.submissions(), 'my-list'] as const,
  mySubmission: (assignmentId: string) =>
    [...assignmentKeys.submissions(), 'my', assignmentId] as const,
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

export const useAllMySubmissions = () => {
  return useQuery<Submission[], Error>({
    queryKey: assignmentKeys.mySubmissionsList(),
    queryFn: async () => {
      console.log('🔄 Fetching all my submissions...');
      console.log('📍 API Endpoint: /assignments/my-submissions');
      console.log('🔑 Token:', localStorage.getItem('token')?.substring(0, 20) + '...');
      
      try {
        const response = await assignmentApi.getAllMySubmissions();
        
        console.log('📦 RAW API Response:', {
          status: response.status,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          hasDataProperty: !!response.data?.data,
          firstItem: Array.isArray(response.data) ? response.data[0] : null,
        });
        
        // Backend trả về TRỰC TIẾP mảng, không có wrapper { data: [...] }
        let submissions: Submission[] = [];
        
        if (Array.isArray(response.data)) {
          // TH1: Backend trả về mảng trực tiếp: [...]
          submissions = response.data;
          console.log('✅ Parsed as direct array');
        } else if (Array.isArray(response.data?.data)) {
          // TH2: Backend trả về { data: [...] }
          submissions = response.data.data;
          console.log('✅ Parsed from data.data');
        } else {
          console.warn('⚠️ Unknown response format, defaulting to empty array');
        }
        
        console.log('✅ All submissions fetched:', {
          count: submissions.length,
          submissions: submissions.map(s => ({
            id: s.id,
            assignmentId: s.assignmentId,
            hasText: !!s.submissionText,
            hasFile: !!s.fileUrl,
            submittedAt: s.submittedAt,
          })),
        });
        
        return submissions;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        
        console.error('❌ Lỗi khi tải tất cả bài nộp:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        
        const errorMessage =
          error.response?.data?.message || 'Không thể tải danh sách bài nộp';
        
        throw new Error(errorMessage);
      }
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    gcTime: 10 * 60 * 1000,
    // QUAN TRỌNG: Refetch khi window focus để luôn có data mới nhất
    refetchOnWindowFocus: true,
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

/**
 * Hook để lấy submission của một assignment cụ thể
 * Lọc từ danh sách tất cả submissions
 */
export const useMySubmission = (assignmentId: string | undefined) => {
  const setMySubmission = useAssignmentStore((s) => s.setMySubmission);

  console.log('🎯 useMySubmission called with assignmentId:', assignmentId);

  // 1. Lấy dữ liệu từ hook tổng
  const {
    data: allSubmissions,
    isLoading,
    isError,
    error,
    dataUpdatedAt, // Timestamp của lần update gần nhất
  } = useAllMySubmissions();

  // Debug: Log mỗi khi allSubmissions thay đổi
  useEffect(() => {
    console.log('📊 allSubmissions updated:', {
      count: allSubmissions?.length || 0,
      dataUpdatedAt: new Date(dataUpdatedAt).toLocaleTimeString(),
      assignments: allSubmissions?.map(s => s.assignmentId),
    });
  }, [allSubmissions, dataUpdatedAt]);

  // 2. Lọc ra submission cụ thể bằng useMemo
  const submission = useMemo(() => {
    console.log('🔍 Filtering submission for assignmentId:', assignmentId);
    
    if (!assignmentId) {
      console.log('⚠️ No assignmentId provided');
      return null;
    }
    
    if (!allSubmissions) {
      console.log('⚠️ allSubmissions is null/undefined');
      return null;
    }

    console.log('🔎 Searching in submissions:', {
      lookingFor: assignmentId,
      availableAssignments: allSubmissions.map(s => s.assignmentId),
    });
    
    const found = allSubmissions.find((sub) => {
      const match = sub.assignmentId === assignmentId;
      console.log(`  Comparing: ${sub.assignmentId} === ${assignmentId} ? ${match}`);
      return match;
    });
    
    if (found) {
      console.log('✅ FOUND submission:', {
        id: found.id,
        assignmentId: found.assignmentId,
        submittedAt: found.submittedAt,
        hasText: !!found.submissionText,
        hasFile: !!found.fileUrl,
      });
    } else {
      console.log('❌ NO submission found for assignment:', assignmentId);
    }
    
    return found || null;
  }, [allSubmissions, assignmentId]);

  // 3. Cập nhật vào Zustand store khi submission thay đổi
  useEffect(() => {
    if (!isLoading) {
      console.log('📝 Updating Zustand store with submission:', 
        submission ? `ID: ${submission.id}` : 'null'
      );
      setMySubmission(submission);
    }
  }, [submission, isLoading, setMySubmission]);

  // 4. Trả về submission cụ thể và trạng thái loading/error
  const result = {
    data: submission,
    isLoading,
    isError,
    error,
  };

  console.log('📤 useMySubmission returning:', {
    hasData: !!result.data,
    isLoading: result.isLoading,
    isError: result.isError,
  });

  return result;
};