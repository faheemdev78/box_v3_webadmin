/**
 * Custom hooks for Till Verification operations
 * Updated for shift-based system
 */

import React from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useAppDispatch, useAppSelector } from '@/rStore/hooks';
import {
  setActiveShift,
  clearShift,
  resetTillVerification,
  setCurrentOrder,
  setQueueLoading,
  setLoading,
  getActiveShift,
  getCurrentOrderId,
  upsertHeldOrder,
  updateOrderItem,
  updateOrderItems,
  updateOrderBaskets,
  updateOrderBags,
  updateOrderTotals,
  removeHeldOrder,
} from '@/rStore/slices/tillVerificationSlice';
import { __error, __yellow } from '@/lib/consoleHelper';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_TILL_QUEUE from '@/graphql/till_verification/getTillVerificationQueue.graphql';
import GET_MY_ACTIVE_SHIFT from '@/graphql/till_verification/getMyActiveTillShift.graphql';
// import GET_MY_LOCKED_ORDERS from '@/graphql/till_verification/getMyLockedOrders.graphql';
import OPEN_TILL_SHIFT from '@/graphql/till_verification/openTillShift.graphql';
import CLOSE_TILL_SHIFT from '@/graphql/till_verification/closeTillShift.graphql';
import START_ORDER_VERIFICATION from '@/graphql/till_verification/startOrderVerification.graphql';
import COMPLETE_ORDER_VERIFICATION from '@/graphql/till_verification/completeOrderVerification.graphql';
import UPDATE_TILL_VERIFICATION_BASKETS from '@/graphql/till_verification/updateTillVerificationBaskets.graphql';
import UPDATE_TILL_VERIFICATION_BAGS from '@/graphql/till_verification/updateTillVerificationBags.graphql';
import VERIFY_ORDER_ITEM from '@/graphql/till_verification/verifyOrderItem.graphql';
import DROP_ORDER_ITEM from '@/graphql/till_verification/dropOrderItem.graphql';
import MARK_ORDER_ITEM_MISSING from '@/graphql/till_verification/markOrderItemMissing.graphql';
import MARK_ORDER_ITEM_DAMAGED from '@/graphql/till_verification/markOrderItemDamaged.graphql';
import MARK_ORDER_ITEM_MISMATCH from '@/graphql/till_verification/markOrderItemMismatch.graphql';
import PRINT_TILL_RECEIPT from '@/graphql/till_verification/printTillReceipt.graphql';
import REMOVE_ORDER_FROM_TILL_SESSION from '@/graphql/till_verification/removeOrderFromTillSession.graphql';

interface GetTillVerificationQueueData {
  getTillVerificationQueue?: {
    orders?: any[];
    total?: number;
    error?: {
      message?: string;
    };
  };
}

interface GetTillVerificationQueueVars {
  _id_store: string;
  limit?: number;
  page?: number;
}

// ===================================
// Shift Management Hooks
// ===================================

/**
 * Hook for getting till verification queue
 */
// TODO: REMOVE this
export const useTillVerificationQueue = (
  _id_store: string,
  limit = 50,
  page = 1
) => {
  const { data, loading, error, refetch } = useQuery<
    GetTillVerificationQueueData,
    GetTillVerificationQueueVars
  >(GET_TILL_QUEUE, {
    variables: { _id_store, limit, page },
    skip: !_id_store,
  });

  return {
    orders: data?.getTillVerificationQueue?.orders || [],
    total: data?.getTillVerificationQueue?.total || 0,
    loading,
    error: error || data?.getTillVerificationQueue?.error,
    refetch,
  };
};

/**
 * Hook for getting my active till shift
 */
export const useMyActiveTillShift = () => {
  const dispatch = useAppDispatch();
  const activeShift = useAppSelector(getActiveShift);

  const { data, loading, error, refetch } = useQuery<any>(GET_MY_ACTIVE_SHIFT, {
    fetchPolicy: "network-only", // 'cache-and-network',
  });

  React.useEffect(() => {
    if (loading) return;

    console.log('🔄 useMyActiveTillShift useEffect triggered', {
      hasData: !!data?.getMyActiveTillShift?.session,
      loading,
      sessionId: data?.getMyActiveTillShift?.session?._id
    });

    if (data?.getMyActiveTillShift?.session) {
      const session = data.getMyActiveTillShift.session;
      console.log('✅ Dispatching setActiveShift to Redux', session);

      if (JSON.stringify(activeShift) !== JSON.stringify(session)) {
        dispatch(setActiveShift(session));
      }
    } else if (!data?.getMyActiveTillShift?.session) {
      console.log('❌ No active shift found, dispatching null to Redux');
      if (activeShift) {
        dispatch(resetTillVerification());
      }
    }
  }, [activeShift, data, dispatch, loading]);

  const session = data?.getMyActiveTillShift?.session || activeShift || null;
  return {
    session,
    loading: loading && !session,
    error: error || data?.getMyActiveTillShift?.error,
    refetch,
  };
};

/**
 * Hook for getting my locked orders
 */
// export const useMyLockedOrders = () => {
//   // const { data, loading, error, refetch } = useQuery(GET_MY_LOCKED_ORDERS, {
//   //   fetchPolicy: 'cache-and-network',
//   //   pollInterval: 10000, // Refresh every 10 seconds
//   // });

//   const { data, loading, error, refetch } = useQuery(GET_MY_LOCKED_ORDERS, {
//     fetchPolicy: 'network-only',
//     // pollInterval: 10000, // Refresh every 10 seconds
//   });
  
//   if (!loading) console.log("data, loading: ", {data})

//   return {
//     orders: data?.getMyLockedOrders || [],
//     total: data?.getMyLockedOrders?.length || 0,
//     loading,
//     error: error,
//     refetch,
//   };
// };

/**
 * Hook for opening till shift
 */
export const useOpenTillShift = () => {
  const dispatch = useAppDispatch();
  const [openShiftMutation, { loading }] = useMutation<any>(OPEN_TILL_SHIFT);

  const openShift = async (_id_store?: string) => {
    
    dispatch(setLoading(true));
    const response = await openShiftMutation({
      variables: _id_store ? { _id_store } : undefined,
    })
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.openTillShift }))
      .catch(catchApolloError)
    dispatch(setLoading(false));
      
    if (response?.error) {
      console.log(__error("response: "), response)
      throw new Error(response.error.message);
    }
    
    if (response?.session) {
      dispatch(setActiveShift(response.session));
    }

    return response;
    
    // try {
    // } catch (error) {
    //   console.error('Error opening till shift:', error);
    //   throw error;
    // } finally {
    //   dispatch(setLoading(false));
    // }
  };

  return { openShift, loading };
};

/**
 * Hook for closing till shift
 */
export const useCloseTillShift = () => {
  const dispatch = useAppDispatch();
  const [closeShiftMutation, { loading }] = useMutation<any>(CLOSE_TILL_SHIFT);

  const closeShift = async (notes?: string) => {
    dispatch(setLoading(true));
    try {
      const result = await closeShiftMutation({
        variables: { notes },
      });

      const response = result.data?.closeTillShift;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      // Clear Redux state
      dispatch(clearShift());

      return response;
    } catch (error) {
      console.error('Error closing till shift:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { closeShift, loading };
};

// ===================================
// Order Verification Hooks
// ===================================

/**
 * Hook for starting order verification
 */
export const useStartOrderVerification = () => {
  const dispatch = useAppDispatch();
  const activeShift = useAppSelector(getActiveShift);

  const [startOrderMutation, { loading, called }] = useMutation<any>(START_ORDER_VERIFICATION, {
    refetchQueries: [GET_TILL_QUEUE],
  });

  const startOrder = async (_id_order?: string, order_barcode?: string) => {
    dispatch(setLoading(true));
    try {
      const response = await startOrderMutation({
        variables: { _id_order, order_barcode },
      })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr:any) => rr?.data?.startOrderVerification }))
        .catch(catchApolloError)

      console.log("response: ", response.order)

      if (response?.error) throw new Error(response.error.message);

      // Add order to held orders cache and set as current
      if (response?.order) {
        dispatch(upsertHeldOrder(response.order));
        dispatch(setCurrentOrder(response.order._id));
      }
      if (response?.session) {
        dispatch(setActiveShift({
          ...(activeShift || {}),
          ...response.session,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error starting order verification:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { startOrder, loading, called };
};

/**
 * Hook for completing order verification
 */
export const useCompleteOrderVerification = () => {
  const dispatch = useAppDispatch();
  const activeShift = useAppSelector(getActiveShift);
  const [completeOrderMutation, { loading }] = useMutation<any>(COMPLETE_ORDER_VERIFICATION, {
    refetchQueries: [GET_TILL_QUEUE, GET_MY_ACTIVE_SHIFT],
  });

  const completeOrder = async (
    _id_order: string,
    notes?: string
  ) => {
    dispatch(setLoading(true));
    try {
      const result = await completeOrderMutation({
        variables: { _id_order, notes },
      });

      const response = result.data?.completeOrderVerification;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      if (response?.session) {
        dispatch(setActiveShift({
          ...(activeShift || {}),
          ...response.session,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error completing order verification:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { completeOrder, loading };
};

export const useRemoveOrderFromTillSession = () => {
  const dispatch = useAppDispatch();
  const activeShift = useAppSelector(getActiveShift);
  const [removeOrderMutation, { loading }] = useMutation<any>(REMOVE_ORDER_FROM_TILL_SESSION, {
    refetchQueries: [GET_TILL_QUEUE, GET_MY_ACTIVE_SHIFT],
  });

  const removeOrderFromSession = async (_id_order: string, reason?: string) => {
    dispatch(setLoading(true));
    try {
      const result = await removeOrderMutation({
        variables: { _id_order, reason },
      });

      const response = result.data?.removeOrderFromTillSession;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      dispatch(removeHeldOrder(_id_order));
      dispatch(setCurrentOrder(null));
      if (response?.session) {
        dispatch(setActiveShift({
          ...(activeShift || {}),
          ...response.session,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error removing order from till session:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { removeOrderFromSession, loading };
};

export const useUpdateTillVerificationBaskets = () => {
  const dispatch = useAppDispatch();
  const activeShift = useAppSelector(getActiveShift);
  const [updateBasketsMutation, { loading }] = useMutation<any>(UPDATE_TILL_VERIFICATION_BASKETS);

  const updateTillVerificationBaskets = async (
    _id_order: string,
    basket_id: string,
    action: 'add' | 'remove'
  ) => {
    dispatch(setLoading(true));
    try {
      const response = await updateBasketsMutation({
        variables: { _id_order, basket_id, action },
      })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.updateTillVerificationBaskets }))
        .catch(catchApolloError);

      if (response?.error) {
        throw new Error(response.error.message);
      }

      if (response?.order?.current_order?.baskets) {
        dispatch(updateOrderBaskets({
          orderId: _id_order,
          baskets: response.order.current_order.baskets,
        }));
      }

      if (response?.session) {
        dispatch(setActiveShift({
          ...(activeShift || {}),
          ...response.session,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error updating till verification baskets:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { updateTillVerificationBaskets, loading };
};

export const useUpdateTillVerificationBags = () => {
  const dispatch = useAppDispatch();
  const activeShift = useAppSelector(getActiveShift);
  const [updateBagsMutation, { loading }] = useMutation<any>(UPDATE_TILL_VERIFICATION_BAGS);

  const updateTillVerificationBags = async (
    _id_order: string,
    bag_id: string,
    action: 'add' | 'remove'
  ) => {
    dispatch(setLoading(true));
    try {
      const response = await updateBagsMutation({
        variables: { _id_order, bag_id, action },
      })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.updateTillVerificationBags }))
        .catch(catchApolloError);

      if (response?.error) {
        throw new Error(response.error.message);
      }

      if (response?.order?.current_order?.bags) {
        dispatch(updateOrderBags({
          orderId: _id_order,
          bags: response.order.current_order.bags,
        }));
      }

      if (response?.order?.current_order?.totals) {
        dispatch(updateOrderTotals({
          orderId: _id_order,
          totals: response.order.current_order.totals,
        }));
      }

      if (response?.session) {
        dispatch(setActiveShift({
          ...(activeShift || {}),
          ...response.session,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error updating till verification bags:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { updateTillVerificationBags, loading };
};

// ===================================
// Item Verification Hooks
// ===================================

/**
 * Hook for verifying order item
 */
export const useVerifyOrderItem = () => {
  const dispatch = useAppDispatch();
  const [verifyItemMutation, { loading }] = useMutation<any>(VERIFY_ORDER_ITEM);

  const verifyItem = async (_id_order: string, _id_product: string, qty_verified: number) => {
    // Optimistic update - backend will set status to 'confirmed'
    dispatch(updateOrderItem({
      orderId: _id_order,
      productId: _id_product,
      updates: {
        processed_qty: qty_verified,
        status: 'confirmed',
        verified_at: new Date(),
      },
    }));

    try {
      const response = await verifyItemMutation({
        variables: { _id_order, _id_product, qty_verified },
      })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.verifyOrderItem }))
        .catch(catchApolloError)

      if (response?.error) {
        throw new Error(response.error.message);
      }

      // Sync with backend response
      if (response?.order?.current_order?.items) {
        dispatch(updateOrderItems({
          orderId: _id_order,
          items: response.order.current_order.items,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error verifying item:', error);
      // Revert optimistic update on error - reset to 'requested' or 'picked'
      dispatch(updateOrderItem({
        orderId: _id_order,
        productId: _id_product,
        updates: {
          processed_qty: 0,
          status: 'requested',
          verified_at: null,
        },
      }));
      throw error;
    }
  };

  return { verifyItem, loading };
};

/**
 * Hook for marking item as missing
 */
export const useMarkOrderItemMissing = () => {
  console.log(__yellow("useMarkOrderItemMissing()"))
  
  const dispatch = useAppDispatch();
  const [markMissingMutation, { loading }] = useMutation<any>(MARK_ORDER_ITEM_MISSING);

  const markMissing = async (_id_order: string, _id_product: string, reason: string) => {
    // Optimistic update - backend will set status to 'out_of_stock'
    dispatch(updateOrderItem({
      orderId: _id_order,
      productId: _id_product,
      updates: {
        processed_qty: 0,
        status: 'out_of_stock',
        issue_reason: reason,
        verified_at: new Date(),
      },
    }));

    try {
      const response = await markMissingMutation({
        variables: { _id_order, _id_product, reason },
      })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.markOrderItemMissing }))
        .catch(catchApolloError)

      if (response?.error) {
        throw new Error(response.error.message);
      }

      // Sync with backend response
      if (response?.order?.current_order?.items) {
        dispatch(updateOrderItems({
          orderId: _id_order,
          items: response.order.current_order.items,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error marking item missing:', error);
      // Revert optimistic update on error
      dispatch(updateOrderItem({
        orderId: _id_order,
        productId: _id_product,
        updates: {
          processed_qty: 0,
          status: 'requested',
          issue_reason: undefined,
          verified_at: null,
        },
      }));
      throw error;
    }
  };

  return { markMissing, loading };
};

export const useDropOrderItem = () => {
  const dispatch = useAppDispatch();
  const [dropOrderItemMutation, { loading }] = useMutation<any>(DROP_ORDER_ITEM);

  const dropOrderItem = async (_id_order: string, _id_product: string) => {
    dispatch(updateOrderItem({
      orderId: _id_order,
      productId: _id_product,
      updates: {
        processed_qty: 0,
        status: 'picked',
        issue_reason: undefined,
        verified_at: null,
      },
    }));

    try {
      const response = await dropOrderItemMutation({
        variables: { _id_order, _id_product },
      })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.dropOrderItem }))
        .catch(catchApolloError);

      if (response?.error) {
        throw new Error(response.error.message);
      }

      if (response?.order?.current_order?.items) {
        dispatch(updateOrderItems({
          orderId: _id_order,
          items: response.order.current_order.items,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error dropping order item:', error);
      throw error;
    }
  };

  return { dropOrderItem, loading };
};

/**
 * Hook for marking item as damaged
 */
export const useMarkOrderItemDamaged = () => {
  const [markDamagedMutation, { loading }] = useMutation<any>(MARK_ORDER_ITEM_DAMAGED, {
    // refetchQueries: [GET_MY_LOCKED_ORDERS],
  });

  const markDamaged = async (_id_order: string, _id_product: string, reason: string) => {
    try {
      const result = await markDamagedMutation({
        variables: { _id_order, _id_product, reason },
      });

      const response = result.data?.markOrderItemDamaged;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      return response;
    } catch (error) {
      console.error('Error marking item damaged:', error);
      throw error;
    }
  };

  return { markDamaged, loading };
};

/**
 * Hook for marking item quantity mismatch
 */
export const useMarkOrderItemMismatch = () => {
  const dispatch = useAppDispatch();
  const [markMismatchMutation, { loading }] = useMutation<any>(MARK_ORDER_ITEM_MISMATCH);

  const markMismatch = async (
    _id_order: string,
    _id_product: string,
    qty_verified: number,
    reason: string
  ) => {
    // Optimistic update - backend will set status to 'confirmed' with issue_reason
    dispatch(updateOrderItem({
      orderId: _id_order,
      productId: _id_product,
      updates: {
        processed_qty: qty_verified,
        status: 'confirmed',
        issue_reason: reason,
        verified_at: new Date(),
      },
    }));

    try {
      const result = await markMismatchMutation({
        variables: { _id_order, _id_product, qty_verified, reason },
      });

      const response = result.data?.markOrderItemMismatch;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      // Sync with backend response
      if (response?.order?.current_order?.items) {
        dispatch(updateOrderItems({
          orderId: _id_order,
          items: response.order.current_order.items,
        }));
      }

      return response;
    } catch (error) {
      console.error('Error marking item mismatch:', error);
      // Revert optimistic update on error
      dispatch(updateOrderItem({
        orderId: _id_order,
        productId: _id_product,
        updates: {
          processed_qty: 0,
          status: 'requested',
          issue_reason: undefined,
          verified_at: null,
        },
      }));
      throw error;
    }
  };

  return { markMismatch, loading };
};

// ===================================
// Composite Hooks
// ===================================

/**
 * Combined hook for item verification actions
 */
export const useItemVerificationActions = () => {
  const { verifyItem, loading: verifyLoading } = useVerifyOrderItem();
  const { markMissing, loading: missingLoading } = useMarkOrderItemMissing();
  const { markDamaged, loading: damagedLoading } = useMarkOrderItemDamaged();
  const { markMismatch, loading: mismatchLoading } = useMarkOrderItemMismatch();

  return {
    verifyItem,
    markMissing,
    markDamaged,
    markMismatch,
    loading: verifyLoading || missingLoading || damagedLoading || mismatchLoading,
  };
};

// ===================================
// Receipt Printing Hook
// ===================================

/**
 * Hook for printing till receipt
 */
export const usePrintTillReceipt = () => {
  const [printReceiptMutation, { loading }] = useMutation<any>(PRINT_TILL_RECEIPT);

  const printReceipt = async (_id_order: string) => {
    try {
      const result = await printReceiptMutation({
        variables: { _id_order },
      });

      const response = result.data?.printTillReceipt;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      return response;
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  };

  return { printReceipt, loading };
};
