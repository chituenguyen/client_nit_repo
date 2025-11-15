// src/api/assignmentApi.ts
import api from './api';
import { type AxiosResponse, AxiosError } from 'axios';
import type {
  Submission,
  CreateAssignmentPayload,
  AssignmentsResponse,
  AssignmentDetailResponse,
} from '../types';

// ==================== API PAYLOADS (DTOs) ====================

export interface SubmitAssignmentDto {
  submissionText?: string;
}

export interface UpdateSubmissionDto {
  submissionText?: string;
  file?: File;
}

// ==================== API RESPONSES ====================

export interface SubmitAssignmentResponse {
  success: boolean;
  data: Submission;
  message?: string;
}

export interface AllMySubmissionsResponse {
  success: boolean;
  data: Submission[];
  message?: string;
}

export interface UpdateSubmissionResponse {
  success: boolean;
  data: Submission;
  message?: string;
}

// ==================== ERROR TYPES ====================

interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
}

// ==================== API METHODS ====================

export const assignmentApi = {
  /**
   * Lấy danh sách assignments theo courseId (Student + Lecturer)
   */
  getAssignmentsByCourse: async (
    courseId: string
  ): Promise<AxiosResponse<AssignmentsResponse>> => {
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    return api.get(`/assignments/course/${courseId}`);
  },

  /**
   * Lấy chi tiết assignment theo ID (Student + Lecturer)
   */
  getAssignmentById: async (
    assignmentId: string
  ): Promise<AxiosResponse<AssignmentDetailResponse>> => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }
    return api.get(`/assignments/${assignmentId}`);
  },

  /**
   * Nộp bài assignment (Student)
   */
  submitAssignment: async (
    assignmentId: string,
    data: { submissionText?: string; file?: File }
  ): Promise<AxiosResponse<SubmitAssignmentResponse>> => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    const formData = new FormData();

    // Chỉ append file nếu nó là File instance thực sự
    if (data.file instanceof File) {
      formData.append('file', data.file);
    }

    // Append submissionText nếu có
    if (data.submissionText != null && data.submissionText.trim() !== '') {
      formData.append('submissionText', data.submissionText.trim());
    }

    // Debug log
    for (const [key, value] of formData.entries()) {
      console.log(`  - ${key}:`, value instanceof File ? `File(${value.name})` : value);
    }

    // Kiểm tra phải có ít nhất 1 trong 2
    if (!formData.has('file') && !formData.has('submissionText')) {
      throw new Error('Phải có ít nhất nội dung văn bản hoặc file để nộp.');
    }

    try {
      const response = await api.post(`/assignments/${assignmentId}/submit`, formData);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('❌ Submit failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      throw error;
    }
  },

  /**
   * Lấy tất cả submissions của student hiện tại
   */
  getAllMySubmissions: async (): Promise<
    AxiosResponse<AllMySubmissionsResponse>
  > => {
    return api.get(`/assignments/my-submissions`);
  },

  /**
   * Cập nhật submission đã nộp (Student)
   */
  updateSubmission: async (
    submissionId: string,
    data: { submissionText?: string; file?: File }
  ): Promise<AxiosResponse<UpdateSubmissionResponse>> => {
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }

    const formData = new FormData();

    // Append file nếu có
    if (data.file instanceof File) {
      formData.append('file', data.file);
    }

    // Append submissionText nếu có
    if (data.submissionText != null && data.submissionText.trim() !== '') {
      formData.append('submissionText', data.submissionText.trim());
    }

    // Kiểm tra phải có ít nhất 1 trong 2
    if (!formData.has('file') && !formData.has('submissionText')) {
      throw new Error('Phải có ít nhất nội dung văn bản hoặc file để cập nhật.');
    }

    try {
      const response = await api.patch(
        `/assignments/submission/${submissionId}`,
        formData
      );
      console.log('✅ Update submission success:', response.data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('❌ Update submission failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      throw error;
    }
  },

  /**
   * Tạo assignment mới (chỉ Lecturer)
   */
  create: async (data: CreateAssignmentPayload, file?: File) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('description', data.description);
    form.append('courseId', data.courseId);
    if (data.dueDate) form.append('dueDate', data.dueDate);
    if (typeof data.maxScore === 'number' && data.maxScore >= 0) {
      form.append('maxScore', String(data.maxScore));
    }
    if (typeof data.weekNumber === 'number' && Number.isInteger(data.weekNumber) && data.weekNumber >= 1) {
      form.append('weekNumber', String(data.weekNumber));
    }
    if (file) form.append('file', file);
    return api.post('/assignments', form);
  },

  /**
   * Cập nhật assignment (chỉ Lecturer)
   */
  update: async (
    assignmentId: string,
    data: Partial<CreateAssignmentPayload> = {},
    file?: File
  ) => {
    const form = new FormData();
    if (data.title !== undefined) form.append('title', data.title);
    if (data.description !== undefined) form.append('description', data.description);
    if (data.courseId !== undefined) form.append('courseId', data.courseId);
    if (data.dueDate) form.append('dueDate', data.dueDate);
    if (typeof data.maxScore === 'number') form.append('maxScore', String(Math.max(0, data.maxScore)));
    if (typeof data.weekNumber === 'number') form.append('weekNumber', String(Math.max(1, data.weekNumber)));
    if (file) form.append('file', file);
    return api.patch(`/assignments/${assignmentId}`, form);
  },

  /**
   * Xóa assignment (chỉ Lecturer)
   */
  delete: async (assignmentId: string) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }
    return api.delete(`/assignments/${assignmentId}`);
  },

  /**
   * Lấy danh sách submissions của assignment (chỉ Lecturer)
   */
  getSubmissions: async (assignmentId: string) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }
    return api.get(`/assignments/${assignmentId}/submissions`);
  },

  /**
   * Lấy chi tiết submission (Lecturer + Student xem submission của mình)
   */
  getSubmissionById: async (submissionId: string) => {
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }
    return api.get(`/assignments/submission/${submissionId}`);
  },

  /**
   * Chấm điểm submission (chỉ Lecturer)
   */
  gradeSubmission: async (submissionId: string, score: number, feedback?: string) => {
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }
    return api.post(`/assignments/submission/${submissionId}/grade`, {
      score,
      feedback,
    });
  },
};

export default assignmentApi;