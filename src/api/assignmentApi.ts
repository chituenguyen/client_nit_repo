// src/api/assignmentApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';
import type {
  Assignment,
  CreateAssignmentPayload,
  AssignmentsResponse,
  AssignmentDetailResponse,
  Submission,
} from '../types';

// Re-export types để các file khác vẫn import được từ đây (tương thích ngược)
export type {
  Assignment,
  CreateAssignmentPayload,
  AssignmentsResponse,
  AssignmentDetailResponse,
  Submission,
};

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