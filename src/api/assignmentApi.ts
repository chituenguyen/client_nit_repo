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

// ==================== API METHODS ====================

export const assignmentApi = {
  /**
   * Lấy danh sách assignments theo courseId
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
   * Lấy chi tiết assignment theo ID
   */
  getAssignmentById: async (
    assignmentId: string
  ): Promise<AxiosResponse<AssignmentDetailResponse>> => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }
    return api.get(`/assignments/${assignmentId}`);
  },
};

export default assignmentApi;