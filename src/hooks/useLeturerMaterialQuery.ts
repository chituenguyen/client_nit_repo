// src/hooks/useLectureMaterialQuery.ts
import { useQuery } from '@tanstack/react-query';
import lectureMaterialApi from '../api/lectureMaterialApi';
import { useLectureMaterialStore } from '../stores/lectureMaterialStore';
import { AxiosError } from 'axios';

// ==================== QUERY KEYS ====================
export const lectureMaterialKeys = {
  all: ['lectureMaterials'] as const,
  lists: () => [...lectureMaterialKeys.all, 'list'] as const,
  listByCourse: (courseId: string) => [...lectureMaterialKeys.lists(), courseId] as const,
  details: () => [...lectureMaterialKeys.all, 'detail'] as const,
  detail: (materialId: string) => [...lectureMaterialKeys.details(), materialId] as const,
};

// ==================== HOOKS ====================

/**
 * Hook để lấy danh sách lecture materials theo courseId
 */
export const useLectureMaterialsByCourse = (courseId: string | undefined) => {
  const setMaterials = useLectureMaterialStore((s) => s.setMaterials);
  const setLoading = useLectureMaterialStore((s) => s.setLoading);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useQuery({
    queryKey: lectureMaterialKeys.listByCourse(courseId || ''),
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');

      try {
        setLoading(true);
        const response = await lectureMaterialApi.getMaterialsByCourse(courseId);
        
        // Parse response - có thể là data.data hoặc data
        const materials = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setMaterials(materials);
        setError(null);

        return materials;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage =
          error.response?.data?.message || 'Không thể tải danh sách tài liệu';

        console.error('❌ Lỗi khi tải lecture materials:', {
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
 * Hook để lấy chi tiết lecture material theo ID
 */
export const useLectureMaterialDetail = (materialId: string | undefined) => {
  const setSelectedMaterial = useLectureMaterialStore((s) => s.setSelectedMaterial);
  const setLoading = useLectureMaterialStore((s) => s.setLoading);
  const setError = useLectureMaterialStore((s) => s.setError);

  return useQuery({
    queryKey: lectureMaterialKeys.detail(materialId || ''),
    queryFn: async () => {
      if (!materialId) throw new Error('Material ID is required');

      try {
        setLoading(true);
        const response = await lectureMaterialApi.getMaterialById(materialId);
        const material = response.data?.data || response.data;

        setSelectedMaterial(material);
        setError(null);

        return material;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage =
          error.response?.data?.message || 'Không thể tải chi tiết tài liệu';

        console.error('❌ Lỗi khi tải chi tiết material:', {
          materialId,
          status: error.response?.status,
          message: errorMessage,
        });

        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!materialId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};