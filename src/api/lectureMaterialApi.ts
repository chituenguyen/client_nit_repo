// src/api/lectureMaterialApi.ts
import api from './api';
import { type AxiosResponse } from 'axios';
import type {
  CreateLectureMaterialData,
  UpdateLectureMaterialData,
  LectureMaterialsParams,
  LectureMaterialsResponse,
  LectureMaterialDetailResponse,
} from '../types';

// ==================== API METHODS ====================

export const lectureMaterialApi = {
  // ==================== LECTURER METHODS ====================

  /**
   * Upload lecture material (Lecturer only) - Multipart/form-data
   * @param data - Material data including file
   */
  createMaterial: async (
    data: CreateLectureMaterialData
  ): Promise<AxiosResponse<LectureMaterialDetailResponse>> => {
    const formData = new FormData();
    
    // Validate required fields
    if (!data.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!data.courseId) {
      throw new Error('Course ID is required');
    }
    if (!data.fileType) {
      throw new Error('File type is required');
    }
    if (!data.file) {
      throw new Error('File is required');
    }
    
    // Prepare metadata with proper types (integer and boolean)
    const weekNum = data.weekNumber && data.weekNumber >= 1 ? data.weekNumber : 1;
    const isPublic = data.isPublic ?? true;
    
    const metadata = {
      title: data.title.trim(),
      description: data.description?.trim() || '',
      courseId: data.courseId,
      fileType: data.fileType,
      weekNumber: weekNum,  // Integer
      isPublic: isPublic,   // Boolean
    };
    
    if (data.description && data.description.trim()) {
      (metadata as any).description = data.description.trim();
    }
    
    // Backend expects these types in FormData but validation requires proper types
    // Solution: Send metadata as individual fields with type casting hints
    formData.append('title', metadata.title);
    formData.append('description', metadata.description || '');
    formData.append('courseId', metadata.courseId);
    formData.append('fileType', metadata.fileType);
    // For NestJS: These will be auto-transformed if DTO has @Type() decorators
    formData.append('weekNumber', String(metadata.weekNumber));
    formData.append('isPublic', String(metadata.isPublic));
    formData.append('file', data.file);

    console.log('📤 Sending to POST /lecture-materials:');
    console.log('Fields:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name}`);
      } else {
        console.log(`  ${key}: "${value}" (will be transformed by backend)`);
      }
    }
    console.log('\n⚠️ Note: Backend must have @Transform decorators in DTO to parse:');
    console.log('  - weekNumber: string -> number');
    console.log('  - isPublic: string -> boolean\n');

    return api.post('/lecture-materials', formData, {
      timeout: 60_000, // Upload có thể lâu hơn 15s mặc định
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  },

  /**
   * Update lecture material (Lecturer only) - Multipart/form-data
   * @param id - Material ID
   * @param data - Updated material data
   */
  updateMaterial: async (
    id: string,
    data: UpdateLectureMaterialData
  ): Promise<AxiosResponse<LectureMaterialDetailResponse>> => {
    // Nếu có file mới, dùng FormData
    if (data.file) {
      const formData = new FormData();
      
      if (data.title?.trim()) {
        formData.append('title', data.title.trim());
      }
      if (data.description?.trim()) {
        formData.append('description', data.description.trim());
      }
      if (data.fileType) {
        formData.append('fileType', data.fileType);
      }
      if (data.weekNumber !== undefined && data.weekNumber !== null) {
        formData.append('weekNumber', String(data.weekNumber));
      }
      if (data.isPublic !== undefined) {
        formData.append('isPublic', String(data.isPublic));
      }
      
      formData.append('file', data.file);

      console.log('📝 Updating material with FormData:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      return api.patch(`/lecture-materials/${id}`, formData);
    }

    // Nếu không có file, dùng JSON (loại bỏ fields rỗng)
    const cleanData: any = {};
    if (data.title?.trim()) cleanData.title = data.title.trim();
    if (data.description?.trim()) cleanData.description = data.description.trim();
    if (data.fileType) cleanData.fileType = data.fileType;
    if (data.weekNumber !== undefined && data.weekNumber !== null) {
      cleanData.weekNumber = data.weekNumber;
    }
    if (data.isPublic !== undefined) cleanData.isPublic = data.isPublic;

    console.log('📝 Updating material with JSON:', cleanData);
    return api.patch(`/lecture-materials/${id}`, cleanData);
  },

  /**
   * Delete lecture material (Lecturer only)
   * @param id - Material ID
   */
  deleteMaterial: async (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return api.delete(`/lecture-materials/${id}`);
  },

  // ==================== PUBLIC/SHARED METHODS ====================

  /**
   * Get all materials for a specific course
   * @param courseId - Course ID
   * @param params - Optional query parameters
   */
  getMaterialsByCourse: async (
    courseId: string,
    params?: Omit<LectureMaterialsParams, 'courseId'>
  ): Promise<AxiosResponse<LectureMaterialsResponse>> => {
    const queryParams: Record<string, string | number> = {};

    if (params?.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
    }

    if (typeof params?.page === 'number') {
      queryParams.page = params.page;
    }

    if (typeof params?.limit === 'number') {
      queryParams.limit = params.limit;
    }

    const weekParam =
      typeof params?.week === 'number'
        ? params.week
        : typeof params?.weekNumber === 'number'
        ? params.weekNumber
        : undefined;

    if (typeof weekParam === 'number') {
      queryParams.week = weekParam;
    }

    return api.get(`/lecture-materials/course/${courseId}`, { params: queryParams });
  },

  /**
   * Get material by ID
   * @param id - Material ID
   */
  getMaterialById: async (id: string): Promise<AxiosResponse<LectureMaterialDetailResponse>> => {
    if (!id) {
      throw new Error('Material ID is required');
    }
    return api.get(`/lecture-materials/${id}`);
  },

  /**
   * Get all materials for enrolled courses (Student only)
   * @param params - Optional query parameters
   */
  getMyMaterials: async (
    params?: LectureMaterialsParams
  ): Promise<AxiosResponse<LectureMaterialsResponse>> => {
    const queryParams: Record<string, string | number> = {};

    if (params?.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
    }

    if (params?.courseId) {
      queryParams.courseId = params.courseId;
    }

    if (typeof params?.page === 'number') {
      queryParams.page = params.page;
    }

    if (typeof params?.limit === 'number') {
      queryParams.limit = params.limit;
    }

    const weekParam =
      typeof params?.week === 'number'
        ? params.week
        : typeof params?.weekNumber === 'number'
        ? params.weekNumber
        : undefined;

    if (typeof weekParam === 'number') {
      queryParams.week = weekParam;
    }

    return api.get('/lecture-materials/my-materials', { params: queryParams });
  },
};

export default lectureMaterialApi;

