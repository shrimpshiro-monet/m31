/**
 * AI Director Plan Store
 * Zustand store for managing AI-generated edit plans
 */

import { create } from 'zustand';
import type {
  EditPlan,
  PlanStatus,
  EditAction,
  ConstraintMode,
  GenerationHistoryEntry,
} from '../types/ai-director.types';

export interface PlanStoreState {
  // State
  currentPlan: EditPlan | null;
  planHistory: EditPlan[];
  generationHistory: GenerationHistoryEntry[];
  status: PlanStatus;
  error: string | null;
  previewMode: boolean;
  selectedConstraints: ConstraintMode;
  pendingChanges: EditAction[];

  // Actions
  setCurrentPlan: (plan: EditPlan | null) => void;
  applyPlan: (plan: EditPlan) => void;
  addToPlanHistory: (plan: EditPlan) => void;
  undoToHistory: (index: number) => void;
  clearPlanHistory: () => void;

  // Refinement
  updatePlanAction: (actionId: string, updates: Partial<EditAction>) => void;
  removePlanAction: (actionId: string) => void;
  addPlanAction: (action: EditAction) => void;
  reorderActions: (fromIndex: number, toIndex: number) => void;

  // UI State
  setStatus: (status: PlanStatus) => void;
  setError: (error: string | null) => void;
  setPreviewMode: (enabled: boolean) => void;
  setSelectedConstraints: (constraints: ConstraintMode) => void;

  // History
  addGenerationHistory: (entry: GenerationHistoryEntry) => void;
  getGenerationHistory: (limit?: number) => GenerationHistoryEntry[];
  clearGenerationHistory: () => void;

  // Utilities
  reset: () => void;
}

const initialState = {
  currentPlan: null,
  planHistory: [],
  generationHistory: [],
  status: 'pending' as PlanStatus,
  error: null,
  previewMode: false,
  selectedConstraints: 'balanced' as ConstraintMode,
  pendingChanges: [] as EditAction[],
};

export const usePlanStore = create<PlanStoreState>((set, get) => ({
  ...initialState,

  // Set current plan
  setCurrentPlan: (plan) => set({ currentPlan: plan, error: null }),

  // Apply plan and add to history
  applyPlan: (plan) => {
    set((state) => ({
      currentPlan: plan,
      planHistory: [...state.planHistory, plan],
      status: 'applied' as PlanStatus,
      pendingChanges: [],
      error: null,
    }));
  },

  // Add plan to history
  addToPlanHistory: (plan) => {
    set((state) => ({
      planHistory: [...state.planHistory, plan],
    }));
  },

  // Undo to specific history point
  undoToHistory: (index) => {
    set((state) => {
      const plan = state.planHistory[index];
      return {
        currentPlan: plan,
        planHistory: state.planHistory.slice(0, index),
      };
    });
  },

  // Clear plan history
  clearPlanHistory: () => set({ planHistory: [] }),

  // Update a specific action in current plan
  updatePlanAction: (actionId, updates) => {
    set((state) => {
      if (!state.currentPlan) return state;

      return {
        currentPlan: {
          ...state.currentPlan,
          actions: state.currentPlan.actions.map((action) =>
            action.id === actionId ? { ...action, ...updates } : action
          ),
        },
        pendingChanges: [...state.pendingChanges],
      };
    });
  },

  // Remove action from current plan
  removePlanAction: (actionId) => {
    set((state) => {
      if (!state.currentPlan) return state;

      return {
        currentPlan: {
          ...state.currentPlan,
          actions: state.currentPlan.actions.filter((action) => action.id !== actionId),
        },
      };
    });
  },

  // Add new action to current plan
  addPlanAction: (action) => {
    set((state) => {
      if (!state.currentPlan) return state;

      return {
        currentPlan: {
          ...state.currentPlan,
          actions: [...state.currentPlan.actions, action],
        },
      };
    });
  },

  // Reorder actions
  reorderActions: (fromIndex, toIndex) => {
    set((state) => {
      if (!state.currentPlan) return state;

      const newActions = [...state.currentPlan.actions];
      const [removed] = newActions.splice(fromIndex, 1);
      newActions.splice(toIndex, 0, removed);

      return {
        currentPlan: {
          ...state.currentPlan,
          actions: newActions,
        },
      };
    });
  },

  // Set generation status
  setStatus: (status) => set({ status }),

  // Set error message
  setError: (error) => set({ error }),

  // Toggle preview mode
  setPreviewMode: (enabled) => set({ previewMode: enabled }),

  // Set constraint profile
  setSelectedConstraints: (constraints) => set({ selectedConstraints: constraints }),

  // Add generation to history
  addGenerationHistory: (entry) => {
    set((state) => ({
      generationHistory: [entry, ...state.generationHistory].slice(0, 50), // Keep last 50
    }));
  },

  // Get generation history
  getGenerationHistory: (limit = 10) => {
    const state = get();
    return state.generationHistory.slice(0, limit);
  },

  // Clear generation history
  clearGenerationHistory: () => set({ generationHistory: [] }),

  // Reset to initial state
  reset: () => set(initialState),
}));

/**
 * Hook for accessing plan store with typing
 */
export function usePlan() {
  return usePlanStore();
}

/**
 * Hook for plan history
 */
export function usePlanHistory() {
  const planHistory = usePlanStore((state) => state.planHistory);
  const addToPlanHistory = usePlanStore((state) => state.addToPlanHistory);
  const undoToHistory = usePlanStore((state) => state.undoToHistory);
  const clearPlanHistory = usePlanStore((state) => state.clearPlanHistory);

  return {
    planHistory,
    addToPlanHistory,
    undoToHistory,
    clearPlanHistory,
    canUndo: planHistory.length > 0,
    historyCount: planHistory.length,
  };
}

/**
 * Hook for generation history
 */
export function useGenerationHistory() {
  const generationHistory = usePlanStore((state) => state.generationHistory);
  const addGenerationHistory = usePlanStore((state) => state.addGenerationHistory);
  const clearGenerationHistory = usePlanStore((state) => state.clearGenerationHistory);

  return {
    generationHistory,
    addGenerationHistory,
    clearGenerationHistory,
    recentGenerations: generationHistory.slice(0, 5),
  };
}
