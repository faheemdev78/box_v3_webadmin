// src/rStore/slices/tillVerificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ===================================
// Types & Interfaces
// ===================================

export interface TillShift {
  _id: string;
  session_started_at: Date;
  performance: {
    total_units_processed: number;
    successful_units: number;
  };
}

export interface TillVerificationState {
  // Active shift session
  activeShift: TillShift | null;

  // UI state
  currentOrderId: string | null; // Which order is on verification screen

  // Queue loading state
  queueLoading: boolean;

  // General UI state
  ui: {
    is_loading: boolean;
    show_held_orders: boolean;
  };
}

// ===================================
// Initial State
// ===================================

const initialState: TillVerificationState = {
  activeShift: null,
  currentOrderId: null,
  queueLoading: false,
  ui: {
    is_loading: false,
    show_held_orders: true,
  },
};

// ===================================
// Redux Slice
// ===================================

export const tillVerificationSlice = createSlice({
  name: 'tillVerification',
  initialState,
  reducers: {
    // ================================
    // Shift Management
    // ================================

    /**
     * Set active shift
     */
    setActiveShift: (state, action: PayloadAction<TillShift | null>) => {
      state.activeShift = action.payload;
    },

    /**
     * Clear shift (on close)
     */
    clearShift: (state) => {
      state.activeShift = null;
      state.currentOrderId = null;
    },

    // ================================
    // Order Management
    // ================================

    /**
     * Set current order being verified
     */
    setCurrentOrder: (state, action: PayloadAction<string | null>) => {
      state.currentOrderId = action.payload;
    },

    // ================================
    // UI State Management
    // ================================

    /**
     * Set queue loading state
     */
    setQueueLoading: (state, action: PayloadAction<boolean>) => {
      state.queueLoading = action.payload;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.ui.is_loading = action.payload;
    },

    /**
     * Toggle held orders panel visibility
     */
    toggleHeldOrdersPanel: (state) => {
      state.ui.show_held_orders = !state.ui.show_held_orders;
    },

    /**
     * Set held orders panel visibility
     */
    setHeldOrdersPanel: (state, action: PayloadAction<boolean>) => {
      state.ui.show_held_orders = action.payload;
    },

    // ================================
    // Reset/Clear Actions
    // ================================

    /**
     * Reset entire state to initial
     */
    resetTillVerification: (state) => {
      Object.assign(state, initialState);
    },
  },
});

// ===================================
// Exports
// ===================================

export const {
  // Shift actions
  setActiveShift,
  clearShift,

  // Order actions
  setCurrentOrder,

  // UI actions
  setQueueLoading,
  setLoading,
  toggleHeldOrdersPanel,
  setHeldOrdersPanel,

  // Reset actions
  resetTillVerification,
} = tillVerificationSlice.actions;

export default tillVerificationSlice.reducer;

// ===================================
// Selectors
// ===================================

export const getTillVerification = (state: any): TillVerificationState =>
  state.tillVerification;

export const getActiveShift = (state: any): TillShift | null =>
  state.tillVerification.activeShift;

export const getCurrentOrderId = (state: any): string | null =>
  state.tillVerification.currentOrderId;

export const getQueueLoading = (state: any): boolean =>
  state.tillVerification.queueLoading;

export const getTillVerificationUI = (state: any) =>
  state.tillVerification.ui;

export const isShiftActive = (state: any): boolean =>
  state.tillVerification.activeShift !== null;