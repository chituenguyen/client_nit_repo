// src/stores/assignmentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type Assignment, type Submission } from '../api/assignmentApi';

interface AssignmentStore {
  // State
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  mySubmission: Submission | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAssignments: (assignments: Assignment[]) => void;
  setSelectedAssignment: (assignment: Assignment | null) => void;
  setMySubmission: (submission: Submission | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  resetError: () => void;
}

const initialState = {
  assignments: [],
  selectedAssignment: null,
  isLoading: false,
  error: null,
};

export const useAssignmentStore = create<AssignmentStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Set danh sách assignments
      setAssignments: (assignments) =>
        set({ assignments, error: null }, false, 'setAssignments'),

      // Set assignment được chọn
      setSelectedAssignment: (assignment) =>
        set(
          { selectedAssignment: assignment, mySubmission: null }, // Reset bài nộp khi chọn assignment khác
          false,
          'setSelectedAssignment'
        ),

      // (MỚI) Set bài nộp của tôi
      setMySubmission: (submission) =>
        set({ mySubmission: submission }, false, 'setMySubmission'),

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
    { name: 'AssignmentStore' }
  )
);

// Selectors để dễ dàng lấy state
export const selectAssignments = (state: AssignmentStore) => state.assignments;
export const selectSelectedAssignment = (state: AssignmentStore) => state.selectedAssignment;
export const selectMySubmission = (state: AssignmentStore) => state.mySubmission;
export const selectIsLoading = (state: AssignmentStore) => state.isLoading;
export const selectError = (state: AssignmentStore) => state.error;