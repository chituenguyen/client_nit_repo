// src/api/lectureMaterialApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';

// ==================== TYPES ====================

export interface LectureMaterial {
  id: string;
  title: string;
  description: string;
  courseId: string;
  weekNumber?: number;
  fileUrl?: string;
  materialType?: 'PDF' | 'VIDEO' | 'SLIDE' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

export interface CreateLectureMaterialPayload {
  title: string;
  description: string;
  courseId: string;
  weekNumber?: number;
  materialType?: 'PDF' | 'VIDEO' | 'SLIDE' | 'OTHER';
}

export interface LectureMaterialsResponse {
  success: boolean;
  data: LectureMaterial[];
  message?: string;
}

export interface LectureMaterialDetailResponse {
  success: boolean;
  data: LectureMaterial;
  message?: string;
}

// ==================== API METHODS ====================

export const lectureMaterialApi = {
  /**
   * Lấy danh sách lecture materials theo courseId
   */
  getMaterialsByCourse: async (
    courseId: string
  ): Promise<AxiosResponse<LectureMaterialsResponse>> => {
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    return api.get(`/lecture-materials/course/${courseId}`);
  },

  /**
   * Lấy chi tiết lecture material theo ID
   */
  getMaterialById: async (
    materialId: string
  ): Promise<AxiosResponse<LectureMaterialDetailResponse>> => {
    if (!materialId) {
      throw new Error('Material ID is required');
    }
    return api.get(`/lecture-materials/${materialId}`);
  },

  /**
   * Tạo lecture material mới (chỉ Lecturer)
   */
  create: async (data: CreateLectureMaterialPayload, file?: File) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('description', data.description);
    form.append('courseId', data.courseId);
    
    if (typeof data.weekNumber === 'number' && Number.isInteger(data.weekNumber) && data.weekNumber >= 1) {
      form.append('weekNumber', String(data.weekNumber));
    }
    
    if (data.materialType) {
      form.append('materialType', data.materialType);
    }
    
    if (file) {
      form.append('file', file);
    }
    
    return api.post('/lecture-materials', form);
  },

  /**
   * Cập nhật lecture material (chỉ Lecturer)
   */
  update: async (
    materialId: string,
    data: Partial<CreateLectureMaterialPayload> = {},
    file?: File
  ) => {
    const form = new FormData();
    
    if (data.title !== undefined) form.append('title', data.title);
    if (data.description !== undefined) form.append('description', data.description);
    if (data.courseId !== undefined) form.append('courseId', data.courseId);
    if (typeof data.weekNumber === 'number') form.append('weekNumber', String(Math.max(1, data.weekNumber)));
    if (data.materialType) form.append('materialType', data.materialType);
    if (file) form.append('file', file);
    
    return api.patch(`/lecture-materials/${materialId}`, form);
  },

  /**
   * Xóa lecture material (chỉ Lecturer)
   */
  delete: async (materialId: string) => {
    if (!materialId) {
      throw new Error('Material ID is required');
    }
    return api.delete(`/lecture-materials/${materialId}`);
  },
};

export default lectureMaterialApi;