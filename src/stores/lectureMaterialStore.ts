// src/stores/lectureMaterialStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LectureMaterial } from '../api/lectureMaterialApi';

export interface LectureMaterialStore {
  // State
  materials: LectureMaterial[];
  selectedMaterial: LectureMaterial | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setMaterials: (materials: LectureMaterial[]) => void;
  setSelectedMaterial: (material: LectureMaterial | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  resetError: () => void;
}

const initialState = {
  materials: [],
  selectedMaterial: null,
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
export const selectIsLoading = (state: LectureMaterialStore) => state.isLoading;
export const selectError = (state: LectureMaterialStore) => state.error;