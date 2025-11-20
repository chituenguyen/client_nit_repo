// src/hooks/useLectureMaterialQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import lectureMaterialApi from '../api/lectureMaterialApi';
import { useLectureMaterialStore } from '../stores/lectureMaterialStore';
import type {
  CreateLectureMaterialData,
  UpdateLectureMaterialData,
  LectureMaterialsParams,
} from '../types';
import { AxiosError } from 'axios';

// ==================== ERROR TYPES ====================
interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
}

// ==================== QUERY KEYS ====================
export const lectureMaterialKeys = {
  all: ['lecture-materials'] as const,
  lists: () => [...lectureMaterialKeys.all, 'list'] as const,
  list: (params?: LectureMaterialsParams) => [...lectureMaterialKeys.lists(), params] as const,
  byCourse: (courseId: string, params?: Omit<LectureMaterialsParams, 'courseId'>) =>
    [...lectureMaterialKeys.all, 'course', courseId, params] as const,
  myMaterials: (params?: LectureMaterialsParams) =>
    [...lectureMaterialKeys.all, 'my-materials', params] as const,
  detail: (id: string) => [...lectureMaterialKeys.all, 'detail', id] as const,
};

// ==================== HOOKS ====================

/**
 * Hook để lấy materials theo course ID
 */
export const useMaterialsByCourse = (
  courseId: string,
  params?: Omit<LectureMaterialsParams, 'courseId'>
) => {
  const setMaterials = useLectureMaterialStore((s) => s.setMaterials);
  const setLoading = useLectureMaterialStore((s) => s.setLoading);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useQuery({
    queryKey: lectureMaterialKeys.byCourse(courseId, params),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await lectureMaterialApi.getMaterialsByCourse(courseId, params);
        
        // Parse response
        const responseData: any = response.data;
        const materials = Array.isArray(responseData?.data?.items)
          ? responseData.data.items
          : Array.isArray(responseData?.data)
          ? responseData.data
          : [];

        console.log('✅ Fetched materials for course:', courseId, materials);
        
        setMaterials(materials);
        setError(null);
        
        return materials;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải tài liệu';
        
        console.error('❌ Lỗi khi tải materials:', {
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
    staleTime: 30 * 1000, // 30 giây
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Hook để lấy materials của các khóa học đã đăng ký (Student only)
 */
export const useMyMaterials = (params?: LectureMaterialsParams) => {
  const setMaterials = useLectureMaterialStore((s) => s.setMaterials);
  const setLoading = useLectureMaterialStore((s) => s.setLoading);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useQuery({
    queryKey: lectureMaterialKeys.myMaterials(params),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await lectureMaterialApi.getMyMaterials(params);
        
        // Parse response
        const responseData: any = response.data;
        const materials = Array.isArray(responseData?.data?.items)
          ? responseData.data.items
          : Array.isArray(responseData?.data)
          ? responseData.data
          : [];

        console.log('✅ Fetched my materials:', materials);
        
        setMaterials(materials);
        setError(null);
        
        return materials;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải tài liệu';
        
        console.error('❌ Lỗi khi tải my materials:', {
          status: error.response?.status,
          message: errorMessage,
        });
        
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Hook để lấy material theo ID
 */
export const useMaterialById = (id: string | undefined) => {
  const setSelectedMaterial = useLectureMaterialStore((s) => s.setSelectedMaterial);
  const setLoading = useLectureMaterialStore((s) => s.setLoading);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useQuery({
    queryKey: lectureMaterialKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Material ID is required');
      
      try {
        setLoading(true);
        const response = await lectureMaterialApi.getMaterialById(id);
        
        const material = response.data?.data;
        
        console.log('✅ Fetched material detail:', material);
        
        setSelectedMaterial(material);
        setError(null);
        
        return material;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || 'Không thể tải chi tiết tài liệu';
        
        console.error('❌ Lỗi khi tải material detail:', {
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
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Hook để upload material mới (Lecturer only)
 */
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  const addMaterial = useLectureMaterialStore((s) => s.addMaterial);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useMutation({
    mutationFn: (data: CreateLectureMaterialData) => {
      console.log('📤 Creating material:', data);
      return lectureMaterialApi.createMaterial(data);
    },
    onSuccess: (response, variables) => {
      const material = response.data?.data;
      
      console.log('✅ Material created successfully:', material);
      
      if (material) {
        addMaterial(material);
      }
      
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ 
        queryKey: lectureMaterialKeys.byCourse(variables.courseId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: lectureMaterialKeys.lists() 
      });
    },
    onError: (err) => {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || 'Không thể tạo tài liệu';
      
      console.error('❌ Lỗi khi tạo material:');
      console.error('Status:', error.response?.status);
      console.error('Error Data:', JSON.stringify(errorData, null, 2));
      console.error('Message:', errorMessage);
      
      // Nếu message là array, hiển thị từng lỗi
      const displayMessage = Array.isArray(errorMessage) 
        ? errorMessage.join('\n') 
        : errorMessage;
      
      setError(displayMessage);
      
      // Alert để user thấy lỗi chi tiết
      alert('Lỗi upload:\n' + displayMessage);
    },
  });
};

/**
 * Hook để cập nhật material (Lecturer only)
 */
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  const updateMaterial = useLectureMaterialStore((s) => s.updateMaterial);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLectureMaterialData }) => {
      console.log('📝 Updating material:', id, data);
      return lectureMaterialApi.updateMaterial(id, data);
    },
    onSuccess: (response, variables) => {
      const material = response.data?.data;
      
      console.log('✅ Material updated successfully:', material);
      
      if (material) {
        updateMaterial(variables.id, material);
      }
      
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ 
        queryKey: lectureMaterialKeys.detail(variables.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: lectureMaterialKeys.lists() 
      });
      if (material?.courseId) {
        queryClient.invalidateQueries({ 
          queryKey: lectureMaterialKeys.byCourse(material.courseId) 
        });
      }
    },
    onError: (err) => {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật tài liệu';
      
      console.error('❌ Lỗi khi cập nhật material:', {
        status: error.response?.status,
        message: errorMessage,
      });
      
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
};

/**
 * Hook để xóa material (Lecturer only)
 */
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  const removeMaterial = useLectureMaterialStore((s) => s.removeMaterial);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId?: string }) => {
      console.log('🗑️ Deleting material:', id);
      return lectureMaterialApi.deleteMaterial(id);
    },
    onSuccess: (_, variables) => {
      console.log('✅ Material deleted successfully:', variables.id);
      
      removeMaterial(variables.id);
      
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ 
        queryKey: lectureMaterialKeys.lists() 
      });
      if (variables.courseId) {
        queryClient.invalidateQueries({ 
          queryKey: lectureMaterialKeys.byCourse(variables.courseId) 
        });
      }
    },
    onError: (err) => {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Không thể xóa tài liệu';
      
      console.error('❌ Lỗi khi xóa material:', {
        status: error.response?.status,
        message: errorMessage,
      });
      
      setError(errorMessage);
    },
  });
};

