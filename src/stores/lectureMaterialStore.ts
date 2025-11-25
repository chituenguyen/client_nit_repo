// src/stores/lectureMaterialStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LectureMaterial } from '../types';

interface LectureMaterialStore {
  // State
  materials: LectureMaterial[];
  selectedMaterial: LectureMaterial | null;
  selectedCourseId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setMaterials: (materials: LectureMaterial[]) => void;
  setSelectedMaterial: (material: LectureMaterial | null) => void;
  setSelectedCourseId: (courseId: string | null) => void;
  addMaterial: (material: LectureMaterial) => void;
  updateMaterial: (id: string, material: Partial<LectureMaterial>) => void;
  removeMaterial: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  resetError: () => void;
}

const initialState = {
  materials: [],
  selectedMaterial: null,
  selectedCourseId: null,
  isLoading: false,
  error: null,
};

export const useLectureMaterialStore = create<LectureMaterialStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Set danh sách materials
      setMaterials: (materials) =>
        set({ materials, error: null }, false, 'setMaterials'),

      // Set material được chọn
      setSelectedMaterial: (material) =>
        set({ selectedMaterial: material }, false, 'setSelectedMaterial'),

      // Set course ID được chọn
      setSelectedCourseId: (courseId) =>
        set({ selectedCourseId: courseId }, false, 'setSelectedCourseId'),

      // Thêm material mới
      addMaterial: (material) =>
        set(
          (state) => ({
            materials: [material, ...state.materials],
          }),
          false,
          'addMaterial'
        ),

      // Cập nhật material
      updateMaterial: (id, updatedMaterial) =>
        set(
          (state) => ({
            materials: state.materials.map((material) =>
              material.id === id ? { ...material, ...updatedMaterial } : material
            ),
            selectedMaterial:
              state.selectedMaterial?.id === id
                ? { ...state.selectedMaterial, ...updatedMaterial }
                : state.selectedMaterial,
          }),
          false,
          'updateMaterial'
        ),

      // Xóa material
      removeMaterial: (id) =>
        set(
          (state) => ({
            materials: state.materials.filter((material) => material.id !== id),
            selectedMaterial:
              state.selectedMaterial?.id === id ? null : state.selectedMaterial,
          }),
          false,
          'removeMaterial'
        ),

      // Set loading state
      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      // Set error
      setError: (error) =>
        set({ error, isLoading: false }, false, 'setError'),

      // Reset toàn bộ store
      reset: () =>
        set(initialState, false, 'reset'),

      // Reset lỗi
      resetError: () =>
        set({ error: null }, false, 'resetError'),
    }),
    { name: 'LectureMaterialStore' }
  )
);

// Selectors để dễ dàng lấy state
export const selectMaterials = (state: LectureMaterialStore) => state.materials;
export const selectSelectedMaterial = (state: LectureMaterialStore) => state.selectedMaterial;
export const selectSelectedCourseId = (state: LectureMaterialStore) => state.selectedCourseId;
export const selectIsLoading = (state: LectureMaterialStore) => state.isLoading;
export const selectError = (state: LectureMaterialStore) => state.error;