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

export interface OrderItem {
  _id_product: string;
  title: string;
  barcode?: string;
  qty: number;
  price: number;
  total: number;
  processed_qty: number;
  // Backend uses 'status' field with values: confirmed, out_of_stock, damaged, requested, picked
  status?: string;
  issue_reason?: string;
  verified_at?: Date | null;
}

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  grandTotal: number;
  // Legacy fields for backward compatibility
  subTotal?: number;
  discount?: number;
  tax?: number;
}

export interface HeldOrder {
  _id: string;
  serial: string;
  customer?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  current_order?: {
    items: OrderItem[];
    totals: OrderTotals;
    stage?: string;
    handled_by?: {
      _id: string;
      name: string;
    };
  };
  processing_stages?: {
    picking?: {
      handled_by?: {
        _id: string;
        name: string;
      };
    };
  };
  status?: {
    order: string;
    payment: string;
    fulfillment: string;
  };
  locked_by?: string;
  locked_at?: Date;
  lock_expires_at?: Date;
  is_locked_by_me?: boolean;
  last_updated_at?: Date; // Local tracking for UI
}

export interface TillVerificationState {
  // Active shift session
  activeShift: TillShift | null;

  // Held orders cache (key: orderId)
  heldOrders: Record<string, HeldOrder>;

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
  heldOrders: {},
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
      console.log('📦 Redux reducer setActiveShift called', {
        payload: action.payload,
        previousShift: state.activeShift,
      });
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

    /**
     * Add or update a held order in the cache
     */
    upsertHeldOrder: (state, action: PayloadAction<HeldOrder>) => {
      const order = action.payload;
      console.log("upsertHeldOrder: ", action?.payload?._id)

      // Ensure heldOrders exists (defensive programming)
      if (!state.heldOrders) {
        state.heldOrders = {};
      }

      state.heldOrders[order._id] = {
        ...order,
        last_updated_at: new Date(),
      };
    },

    /**
     * Update order items after verification action
     */
    updateOrderItems: (state, action: PayloadAction<{ orderId: string; items: OrderItem[] }>) => {
      const { orderId, items } = action.payload;

      // Ensure heldOrders exists
      if (!state.heldOrders) {
        state.heldOrders = {};
      }

      if (state.heldOrders[orderId]) {
        state.heldOrders[orderId].current_order = {
          ...state.heldOrders[orderId].current_order!,
          items,
        };
        state.heldOrders[orderId].last_updated_at = new Date();
      }
    },

    /**
     * Update order totals after verification action
     */
    updateOrderTotals: (state, action: PayloadAction<{ orderId: string; totals: OrderTotals }>) => {
      const { orderId, totals } = action.payload;

      // Ensure heldOrders exists
      if (!state.heldOrders) {
        state.heldOrders = {};
      }

      if (state.heldOrders[orderId]?.current_order) {
        state.heldOrders[orderId].current_order!.totals = totals;
        state.heldOrders[orderId].last_updated_at = new Date();
      }
    },

    /**
     * Update a single item in an order (optimistic update)
     */
    updateOrderItem: (
      state,
      action: PayloadAction<{
        orderId: string;
        productId: string;
        updates: Partial<OrderItem>;
      }>
    ) => {
      const { orderId, productId, updates } = action.payload;

      // Ensure heldOrders exists
      if (!state.heldOrders) {
        state.heldOrders = {};
      }

      const order = state.heldOrders[orderId];
      if (order?.current_order?.items) {
        const itemIndex = order.current_order.items.findIndex(
          (item) => item._id_product === productId
        );
        if (itemIndex !== -1) {
          order.current_order.items[itemIndex] = {
            ...order.current_order.items[itemIndex],
            ...updates,
          };
          order.last_updated_at = new Date();
        }
      }
    },

    /**
     * Remove order from held orders (on complete)
     */
    removeHeldOrder: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;

      // Ensure heldOrders exists
      if (!state.heldOrders) {
        state.heldOrders = {};
      }

      delete state.heldOrders[orderId];
      if (state.currentOrderId === orderId) {
        state.currentOrderId = null;
      }
    },

    /**
     * Clear all held orders
     */
    clearHeldOrders: (state) => {
      state.heldOrders = {};
      state.currentOrderId = null;
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
  upsertHeldOrder,
  updateOrderItems,
  updateOrderTotals,
  updateOrderItem,
  removeHeldOrder,
  clearHeldOrders,

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

// ===================================
// Held Orders Selectors
// ===================================

export const getHeldOrders = (state: any): Record<string, HeldOrder> =>
  state.tillVerification.heldOrders;

export const getHeldOrdersArray = (state: any): HeldOrder[] =>
  Object.values(state.tillVerification?.heldOrders || {});

export const getHeldOrderById = (state: any, orderId: string): HeldOrder | null =>
  state.tillVerification?.heldOrders?.[orderId] || null;

export const getCurrentOrder = (state: any): HeldOrder | null => {
  const currentOrderId = state.tillVerification?.currentOrderId;
  if (!currentOrderId) return null;
  const heldOrders = state.tillVerification?.heldOrders;
  if (!heldOrders) return null;
  return heldOrders[currentOrderId] || null;
};

export const getHeldOrdersCount = (state: any): number =>
  Object.keys(state.tillVerification?.heldOrders || {}).length;

// ===================================
// Statistics Selectors
// ===================================

export interface VerificationStats {
  total_items: number;
  verified_count: number;
  pending_count: number;
  missing_count: number;
  mismatch_count: number;
  completion_percentage: number;
}

export const getVerificationStats = (state: any): VerificationStats => {
  const currentOrder = getCurrentOrder(state);

  if (!currentOrder?.current_order?.items) {
    return {
      total_items: 0,
      verified_count: 0,
      pending_count: 0,
      missing_count: 0,
      mismatch_count: 0,
      completion_percentage: 0,
    };
  }

  const items = currentOrder.current_order.items;
  const total_items = items.length;

  // Count items by status
  const verified_count = items.filter(item => item.verified_at !== null && item.verified_at !== undefined).length;
  const missing_count = items.filter(item => item.status === 'out_of_stock').length;
  const mismatch_count = items.filter(item => item.processed_qty !== item.qty && item.status !== 'out_of_stock').length;
  const pending_count = total_items - verified_count;

  const completion_percentage = total_items > 0
    ? Math.round((verified_count / total_items) * 100)
    : 0;

  return {
    total_items,
    verified_count,
    pending_count,
    missing_count,
    mismatch_count,
    completion_percentage,
  };
};