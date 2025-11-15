// src/hooks/useAssignmentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import assignmentApi, { type Submission } from '../api/assignmentApi';
import { assignmentKeys } from './useAssignmentQuery';
import { AxiosError } from 'axios';
import { useAssignmentStore } from '../stores/assignmentStore';

interface SubmitAssignmentData {
  assignmentId: string;
  submissionText?: string;
  file?: File;
}

/**
 * Hook để nộp bài tập (mutation)
 */
export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  const setMySubmission = useAssignmentStore((s) => s.setMySubmission);

  return useMutation<Submission, Error, SubmitAssignmentData>({
    mutationFn: async ({
      assignmentId,
      submissionText,
      file,
    }: SubmitAssignmentData) => {
      
      const response = await assignmentApi.submitAssignment(assignmentId, {
        submissionText,
        file,
      });

      const newSubmission = response.data?.data || response.data;

      if (!newSubmission || typeof newSubmission.id !== 'string') {
        console.error('❌ Invalid response from server:', response.data);
        throw new Error('Phản hồi từ server không hợp lệ sau khi nộp bài.');
      }
      return newSubmission;
    },

    onSuccess: (newSubmission) => {
      
      // 1. Update Zustand store ngay lập tức
      setMySubmission(newSubmission);
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.mySubmissionsList(),
      });

      // 3. Invalidate query cho submission cụ thể (nếu có cache riêng)
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.mySubmission(newSubmission.assignmentId),
      });

      // 4. (Optional) Set data trực tiếp vào cache để UI update ngay
      // Cách này giúp UI update NGAY mà không cần đợi refetch
      queryClient.setQueryData<Submission[]>(
        assignmentKeys.mySubmissionsList(),
        (oldData) => {
          if (!oldData) return [newSubmission];
          
          // Kiểm tra xem submission này đã tồn tại chưa
          const exists = oldData.some(
            (sub) => sub.assignmentId === newSubmission.assignmentId
          );
          
          if (exists) {
            // Update submission cũ
            return oldData.map((sub) =>
              sub.assignmentId === newSubmission.assignmentId
                ? newSubmission
                : sub
            );
          } else {
            // Thêm submission mới
            return [...oldData, newSubmission];
          }
        }
      );
    },

    onError: (err) => {
      const error = err as AxiosError<{ message?: string }>;

      const errorMessage =
        (err as Error)?.message ||
        error.response?.data?.message ||
        'Nộp bài thất bại. Vui lòng thử lại.';

      console.error('❌ Lỗi khi nộp bài:', {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });

      throw new Error(errorMessage);
    },
  });
};

interface UpdateSubmissionData {
  submissionId: string;
  submissionText?: string;
  file?: File;
}

/**
 * Hook để cập nhật bài nộp đã submit
 */
export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();
  const setMySubmission = useAssignmentStore((s) => s.setMySubmission);

  return useMutation<Submission, Error, UpdateSubmissionData>({
    mutationFn: async ({
      submissionId,
      submissionText,
      file,
    }: UpdateSubmissionData) => {
      const response = await assignmentApi.updateSubmission(submissionId, {
        submissionText,
        file,
      });

      const updatedSubmission = response.data?.data || response.data;

      if (!updatedSubmission || typeof updatedSubmission.id !== 'string') {
        console.error('❌ Invalid response from server:', response.data);
        throw new Error('Phản hồi từ server không hợp lệ sau khi cập nhật.');
      }

      return updatedSubmission;
    },

    onSuccess: (updatedSubmission) => {
      console.log('✅ Submission updated successfully:', updatedSubmission);

      // 1. Update Zustand store
      setMySubmission(updatedSubmission);

      // 2. Invalidate all submissions list
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.mySubmissionsList(),
      });

      // 3. Invalidate specific submission
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.mySubmission(updatedSubmission.assignmentId),
      });

      // 4. Set data trực tiếp vào cache
      queryClient.setQueryData<Submission[]>(
        assignmentKeys.mySubmissionsList(),
        (oldData) => {
          if (!oldData) return [updatedSubmission];

          return oldData.map((sub) =>
            sub.id === updatedSubmission.id ? updatedSubmission : sub
          );
        }
      );
    },

    onError: (err) => {
      const error = err as AxiosError<{ message?: string }>;

      const errorMessage =
        (err as Error)?.message ||
        error.response?.data?.message ||
        'Cập nhật bài nộp thất bại. Vui lòng thử lại.';

      console.error('❌ Lỗi khi cập nhật bài nộp:', {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });

      throw new Error(errorMessage);
    },
  });
};