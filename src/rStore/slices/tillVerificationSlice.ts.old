// src/rStore/slices/tillVerificationSlice.ts
import { __yellow } from '@_/lib/consoleHelper';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ===================================
// Types & Interfaces
// ===================================

export type VerificationItemStatus =
  | 'pending'
  | 'verified'
  | 'missing'
  | 'mismatch'
  | 'substitute';

export type ScanningMode = 'manual' | 'scanner';

export interface SubstituteProduct {
  _id: string;
  title: string;
  price: number;
}

export interface VerificationItem {
  status: VerificationItemStatus;
  qty_expected: number;
  qty_verified: number;
  notes: string;
  verified_at: Date | null;
  substitute_product?: SubstituteProduct;
}

export interface VerificationStats {
  total_items: number;
  verified_count: number;
  pending_count: number;
  missing_count: number;
  mismatch_count: number;
  completion_percentage: number;
}

export interface BasketInfo {
  _id: string;
  barcode: string;
  title: string;
  category: string;
  color?: string;
}

export interface HeldSession {
  _id_session: string;
  _id_order: string;
  order_serial: string;
  held_at: Date;
  progress_snapshot: {
    items: { [itemId: string]: VerificationItem };
    stats: VerificationStats;
  };
  items_verified: number;
  total_items: number;
}

export interface ActiveSession {
  _id_session: string | null;
  _id_order: string | null;
  started_at: Date | null;
  order_data: any | null; // Will be populated with full Order type
}

export interface VerificationProgress {
  items: { [itemId: string]: VerificationItem };
  stats: VerificationStats;
}

export interface UIState {
  scanning_mode: ScanningMode;
  current_item_focus: string | null;
  is_loading: boolean;
  show_held_sessions: boolean;
}

export interface TillVerificationState {
  activeSession: ActiveSession;
  verificationProgress: VerificationProgress;
  pickerBaskets: BasketInfo[];
  deliveryBaskets: string[];
  availableDeliveryBaskets: BasketInfo[];
  heldSessions: HeldSession[];
  ui: UIState;
}

// ===================================
// Initial State
// ===================================

const initialState: TillVerificationState = {
  activeSession: {
    _id_session: null,
    _id_order: null,
    started_at: null,
    order_data: null,
  },
  verificationProgress: {
    items: {},
    stats: {
      total_items: 0,
      verified_count: 0,
      pending_count: 0,
      missing_count: 0,
      mismatch_count: 0,
      completion_percentage: 0,
    },
  },
  pickerBaskets: [],
  deliveryBaskets: [],
  availableDeliveryBaskets: [],
  heldSessions: [],
  ui: {
    scanning_mode: 'manual',
    current_item_focus: null,
    is_loading: false,
    show_held_sessions: false,
  },
};

// ===================================
// Helper Functions
// ===================================

/**
 * Calculate verification statistics from items
 */
const calculateStats = (items: { [itemId: string]: VerificationItem }): VerificationStats => {
  const itemsArray = Object.values(items);
  const total_items = itemsArray.length;

  if (total_items === 0) {
    return {
      total_items: 0,
      verified_count: 0,
      pending_count: 0,
      missing_count: 0,
      mismatch_count: 0,
      completion_percentage: 0,
    };
  }

  const verified_count = itemsArray.filter(item => item.status === 'verified').length;
  const pending_count = itemsArray.filter(item => item.status === 'pending').length;
  const missing_count = itemsArray.filter(item => item.status === 'missing').length;
  const mismatch_count = itemsArray.filter(item => item.status === 'mismatch').length;

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


/**
 * Initialize items from order data with pending status
 */
const initializeItemsFromOrder = (orderData: any): { [itemId: string]: VerificationItem } => {
  if (!orderData?.current_order?.items) return {};

  console.log(__yellow('initializeItemsFromOrder() - raw items:'), orderData.current_order.items);

  const items: { [itemId: string]: VerificationItem } = {};

  orderData.current_order.items.forEach((orderItem: any) => {
    console.log(__yellow('Processing orderItem:'), orderItem);
    console.log(__yellow('orderItem._id_product:'), orderItem._id_product);
    console.log(__yellow('orderItem keys:'), Object.keys(orderItem));

    const itemId = orderItem._id_product || orderItem._id || orderItem.id;
    console.log(__yellow('Using itemId:'), itemId);

    items[itemId] = {
      status: 'pending',
      qty_expected: orderItem.qty || 1,
      qty_verified: 0,
      notes: '',
      verified_at: null,
    };
  });

  console.log(__yellow('initializeItemsFromOrder() - final items:'), items);

  return items;
};
// ===================================
// Redux Slice
// ===================================

export const tillVerificationSlice = createSlice({
  name: 'tillVerification',
  initialState,
  reducers: {

    // ================================
    // Session Management
    // ================================

    /**
     * Start a new verification session
     */
    startSession: (state, action: PayloadAction<{
      _id_session: string;
      _id_order: string;
      order_data: any;
    }>) => {
      const { _id_session, _id_order, order_data } = action.payload;

      state.activeSession = {
        _id_session,
        _id_order,
        started_at: new Date(),
        order_data,
      };

      // Initialize all items as pending
      const items = initializeItemsFromOrder(order_data);
      state.verificationProgress.items = items;
      state.verificationProgress.stats = calculateStats(items);

      // Load picker baskets from order
      state.pickerBaskets = order_data?.current_order?.baskets || [];

      // Reset delivery baskets
      state.deliveryBaskets = [];

      // Reset UI state
      state.ui.current_item_focus = null;
      state.ui.is_loading = false;
    },

    /**
     * Clear/end active session
     */
    endSession: (state) => {
      state.activeSession = initialState.activeSession;
      state.verificationProgress = initialState.verificationProgress;
      state.pickerBaskets = [];
      state.deliveryBaskets = [];
      state.ui.current_item_focus = null;
    },

    /**
     * Hold current session (save to held sessions)
     */
    holdCurrentSession: (state) => {
      if (!state.activeSession._id_session) return;

      const heldSession: HeldSession = {
        _id_session: state.activeSession._id_session,
        _id_order: state.activeSession._id_order!,
        order_serial: state.activeSession.order_data?.serial || '',
        held_at: new Date(),
        progress_snapshot: {
          items: { ...state.verificationProgress.items },
          stats: { ...state.verificationProgress.stats },
        },
        items_verified: state.verificationProgress.stats.verified_count,
        total_items: state.verificationProgress.stats.total_items,
      };

      // Add to held sessions
      state.heldSessions.push(heldSession);

      // Clear active session
      state.activeSession = initialState.activeSession;
      state.verificationProgress = initialState.verificationProgress;
      state.pickerBaskets = [];
      state.deliveryBaskets = [];
      state.ui.current_item_focus = null;
    },

    /**
     * Resume a held session
     */
    resumeHeldSession: (state, action: PayloadAction<{
      _id_session: string;
      order_data: any;
    }>) => {
      const { _id_session, order_data } = action.payload;

      // Find the held session
      const heldSessionIndex = state.heldSessions.findIndex(
        session => session._id_session === _id_session
      );

      if (heldSessionIndex === -1) return;

      const heldSession = state.heldSessions[heldSessionIndex];

      // Restore active session
      state.activeSession = {
        _id_session,
        _id_order: heldSession._id_order,
        started_at: new Date(), // Use current time as resumed time
        order_data,
      };

      // Restore verification progress
      state.verificationProgress = {
        items: { ...heldSession.progress_snapshot.items },
        stats: { ...heldSession.progress_snapshot.stats },
      };

      // Restore baskets
      state.pickerBaskets = order_data?.current_order?.baskets || [];

      // Remove from held sessions
      state.heldSessions.splice(heldSessionIndex, 1);

      // Reset UI focus
      state.ui.current_item_focus = null;
    },

    /**
     * Remove a held session (cancel it)
     */
    removeHeldSession: (state, action: PayloadAction<string>) => {
      const _id_session = action.payload;
      state.heldSessions = state.heldSessions.filter(
        session => session._id_session !== _id_session
      );
    },

    // ================================
    // Item Verification Actions
    // ================================

    /**
     * Mark item as verified
     */
    verifyItem: (state, action: PayloadAction<{
      itemId: string;
      qty?: number;
    }>) => {
      console.log(__yellow("verifyItem()"), action)

      const { itemId, qty } = action.payload;

      console.log("state.verificationProgress.items: ", JSON.stringify(state.verificationProgress.items, null, 2))
      console.log("Looking for itemId: ", itemId)
      console.log("Available keys: ", Object.keys(state.verificationProgress.items))

      const item = state.verificationProgress.items[itemId];

      if (!item) {
        console.error(__yellow("Item not found!"), "Looking for:", itemId, "Available:", Object.keys(state.verificationProgress.items));
        return;
      }
      console.log("ITEM: ", item)

      item.status = 'verified';
      item.qty_verified = qty !== undefined ? qty : item.qty_expected;
      item.verified_at = new Date();

      // Recalculate stats
      state.verificationProgress.stats = calculateStats(state.verificationProgress.items);
    },

    /**
     * Mark item as missing
     */
    markItemMissing: (state, action: PayloadAction<{
      itemId: string;
      notes?: string;
    }>) => {
      const { itemId, notes } = action.payload;
      const item = state.verificationProgress.items[itemId];

      if (!item) return;

      item.status = 'missing';
      item.qty_verified = 0;
      item.notes = notes || 'Item not found in basket';
      item.verified_at = new Date();

      // Recalculate stats
      state.verificationProgress.stats = calculateStats(state.verificationProgress.items);
    },

    /**
     * Mark item as quantity mismatch
     */
    markItemMismatch: (state, action: PayloadAction<{
      itemId: string;
      qty_verified: number;
      notes?: string;
    }>) => {
      const { itemId, qty_verified, notes } = action.payload;
      const item = state.verificationProgress.items[itemId];

      if (!item) return;

      item.status = 'mismatch';
      item.qty_verified = qty_verified;
      item.notes = notes || `Expected ${item.qty_expected}, found ${qty_verified}`;
      item.verified_at = new Date();

      // Recalculate stats
      state.verificationProgress.stats = calculateStats(state.verificationProgress.items);
    },

    /**
     * Mark item as substituted
     */
    markItemSubstituted: (state, action: PayloadAction<{
      itemId: string;
      substitute_product: SubstituteProduct;
      qty?: number;
      notes?: string;
    }>) => {
      const { itemId, substitute_product, qty, notes } = action.payload;
      const item = state.verificationProgress.items[itemId];

      if (!item) return;

      item.status = 'substitute';
      item.substitute_product = substitute_product;
      item.qty_verified = qty !== undefined ? qty : item.qty_expected;
      item.notes = notes || `Substituted with ${substitute_product.title}`;
      item.verified_at = new Date();

      // Recalculate stats
      state.verificationProgress.stats = calculateStats(state.verificationProgress.items);
    },

    /**
     * Update item notes
     */
    updateItemNotes: (state, action: PayloadAction<{
      itemId: string;
      notes: string;
    }>) => {
      const { itemId, notes } = action.payload;
      const item = state.verificationProgress.items[itemId];

      if (!item) return;

      item.notes = notes;
    },

    /**
     * Reset item to pending status
     */
    resetItemStatus: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const item = state.verificationProgress.items[itemId];

      if (!item) return;

      item.status = 'pending';
      item.qty_verified = 0;
      item.notes = '';
      item.verified_at = null;
      item.substitute_product = undefined;

      // Recalculate stats
      state.verificationProgress.stats = calculateStats(state.verificationProgress.items);
    },

    // ================================
    // Basket Management
    // ================================

    /**
     * Add delivery basket
     */
    addDeliveryBasket: (state, action: PayloadAction<string>) => {
      const basketId = action.payload;
      if (!state.deliveryBaskets.includes(basketId)) {
        state.deliveryBaskets.push(basketId);
      }
    },

    /**
     * Remove delivery basket
     */
    removeDeliveryBasket: (state, action: PayloadAction<string>) => {
      const basketId = action.payload;
      state.deliveryBaskets = state.deliveryBaskets.filter(id => id !== basketId);
    },

    /**
     * Set available delivery baskets
     */
    setAvailableDeliveryBaskets: (state, action: PayloadAction<BasketInfo[]>) => {
      state.availableDeliveryBaskets = action.payload;
    },

    /**
     * Clear delivery baskets
     */
    clearDeliveryBaskets: (state) => {
      state.deliveryBaskets = [];
    },

    // ================================
    // UI State Management
    // ================================

    /**
     * Set current item focus
     */
    setCurrentItemFocus: (state, action: PayloadAction<string | null>) => {
      state.ui.current_item_focus = action.payload;
    },

    /**
     * Toggle scanning mode
     */
    toggleScanningMode: (state) => {
      state.ui.scanning_mode = state.ui.scanning_mode === 'manual' ? 'scanner' : 'manual';
    },

    /**
     * Set scanning mode
     */
    setScanningMode: (state, action: PayloadAction<ScanningMode>) => {
      state.ui.scanning_mode = action.payload;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.ui.is_loading = action.payload;
    },

    /**
     * Toggle held sessions panel
     */
    toggleHeldSessionsPanel: (state) => {
      state.ui.show_held_sessions = !state.ui.show_held_sessions;
    },

    /**
     * Set held sessions panel visibility
     */
    setHeldSessionsPanel: (state, action: PayloadAction<boolean>) => {
      state.ui.show_held_sessions = action.payload;
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
  // Session actions
  startSession,
  endSession,
  holdCurrentSession,
  resumeHeldSession,
  removeHeldSession,

  // Item verification actions
  verifyItem,
  markItemMissing,
  markItemMismatch,
  markItemSubstituted,
  updateItemNotes,
  resetItemStatus,

  // Basket actions
  addDeliveryBasket,
  removeDeliveryBasket,
  setAvailableDeliveryBaskets,
  clearDeliveryBaskets,

  // UI actions
  setCurrentItemFocus,
  toggleScanningMode,
  setScanningMode,
  setLoading,
  toggleHeldSessionsPanel,
  setHeldSessionsPanel,

  // Reset actions
  resetTillVerification,
} = tillVerificationSlice.actions;

export default tillVerificationSlice.reducer;

// ===================================
// Selectors
// ===================================

export const getTillVerification = (state: any): TillVerificationState =>
  state.tillVerification;

export const getActiveSession = (state: any): ActiveSession =>
  state.tillVerification.activeSession;

export const getVerificationProgress = (state: any): VerificationProgress =>
  state.tillVerification.verificationProgress;

export const getVerificationStats = (state: any): VerificationStats =>
  state.tillVerification.verificationProgress.stats;

export const getVerificationItems = (state: any): { [itemId: string]: VerificationItem } =>
  state.tillVerification.verificationProgress.items;

export const getPickerBaskets = (state: any): BasketInfo[] =>
  state.tillVerification.pickerBaskets;

export const getDeliveryBaskets = (state: any): string[] =>
  state.tillVerification.deliveryBaskets;

export const getAvailableDeliveryBaskets = (state: any): BasketInfo[] =>
  state.tillVerification.availableDeliveryBaskets;

export const getHeldSessions = (state: any): HeldSession[] =>
  state.tillVerification.heldSessions;

export const getTillVerificationUI = (state: any): UIState =>
  state.tillVerification.ui;

export const isSessionActive = (state: any): boolean =>
  state.tillVerification.activeSession._id_session !== null;

export const getSessionOrderData = (state: any): any =>
  state.tillVerification.activeSession.order_data;

export const getSessionStoreId = (state: any): string | null =>
  state.tillVerification.activeSession.order_data?.store?._id || null;
