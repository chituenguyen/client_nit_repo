// src/api/assignmentApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';

// ==================== TYPES ====================

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  maxScore?: number;
  weekNumber?: number;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  fileUrl?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  isLate?: boolean;
  
  // DEPRECATED: Để tương thích code cũ
  grade?: number; // Alias của score
}

// ==================== API PAYLOADS (DTOs) ====================

export interface SubmitAssignmentDto {
  submissionText?: string;
}

export interface UpdateSubmissionDto {
  submissionText?: string;
  file?: File;
}

// ==================== API RESPONSES ====================

export interface AssignmentsResponse {
  success: boolean;
  data: Assignment[];
  message?: string;
}

export interface AssignmentDetailResponse {
  success: boolean;
  data: Assignment;
  message?: string;
}

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

// ==================== API METHODS ====================

export const assignmentApi = {
  getAssignmentsByCourse: async (
    courseId: string
  ): Promise<AxiosResponse<AssignmentsResponse>> => {
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    return api.get(`/assignments/course/${courseId}`);
  },

  getAssignmentById: async (
    assignmentId: string
  ): Promise<AxiosResponse<AssignmentDetailResponse>> => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }
    return api.get(`/assignments/${assignmentId}`);
  },

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
    } catch (error: any) {
      console.error('❌ Submit failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  getAllMySubmissions: async (): Promise<
    AxiosResponse<AllMySubmissionsResponse>
  > => {
    return api.get(`/assignments/my-submissions`);
  },

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
    } catch (error: any) {
      console.error('❌ Update submission failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },
};

export default assignmentApi;