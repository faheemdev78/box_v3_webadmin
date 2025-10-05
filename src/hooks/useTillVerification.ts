/**
 * Custom hooks for Till Verification operations
 * Wraps GraphQL queries and mutations with Redux state management
 */

import { useMutation, useQuery } from '@apollo/client';
import { useAppDispatch, useAppSelector } from '@_/rStore/hooks';
import {
  startSession,
  endSession,
  holdCurrentSession,
  resumeHeldSession,
  verifyItem,
  markItemMissing,
  markItemMismatch,
  setLoading,
  getActiveSession,
  getVerificationProgress,
  getHeldSessions,
} from '@_/rStore/slices/tillVerificationSlice';

import GET_TILL_QUEUE from '@_/graphql/till_verification/getTillVerificationQueue.graphql';
import START_TILL_SESSION from '@_/graphql/till_verification/startTillVerificationSession.graphql';
import HOLD_TILL_SESSION from '@_/graphql/till_verification/holdTillVerificationSession.graphql';
import RESUME_TILL_SESSION from '@_/graphql/till_verification/resumeTillVerificationSession.graphql';
import COMPLETE_TILL_SESSION from '@_/graphql/till_verification/completeTillVerificationSession.graphql';
import CANCEL_TILL_SESSION from '@_/graphql/till_verification/cancelTillVerificationSession.graphql';
import GET_HELD_SESSIONS from '@_/graphql/till_verification/getHeldTillSessions.graphql';
import GET_ACTIVE_SESSION from '@_/graphql/till_verification/getActiveTillSession.graphql';

/**
 * Hook for getting till verification queue
 */
export const useTillVerificationQueue = (_id_store: string, limit = 50, page = 1) => {
  const { data, loading, error, refetch } = useQuery(GET_TILL_QUEUE, {
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
 * Hook for starting a till verification session
 */
export const useStartTillSession = () => {
  const dispatch = useAppDispatch();
  const [startSessionMutation, { loading }] = useMutation(START_TILL_SESSION);

  const startTillSession = async (_id_order: string) => {
    dispatch(setLoading(true));
    try {
      const result = await startSessionMutation({
        variables: {
          input: { _id_order },
        },
      });

      const response = result.data?.startTillVerificationSession;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      if (response?.session) {
        // Initialize Redux state with session data
        dispatch(
          startSession({
            _id_session: response.session._id,
            _id_order: response.session._id_order,
            order_data: response.session.order_data,
          })
        );
      }

      return response;
    } catch (error) {
      console.error('Error starting till session:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { startTillSession, loading };
};

/**
 * Hook for holding current session
 */
export const useHoldTillSession = () => {
  const dispatch = useAppDispatch();
  const activeSession = useAppSelector(getActiveSession);
  const verificationProgress = useAppSelector(getVerificationProgress);
  const [holdSessionMutation, { loading }] = useMutation(HOLD_TILL_SESSION);

  const holdSession = async (notes?: string) => {
    if (!activeSession._id_session) {
      throw new Error('No active session to hold');
    }

    dispatch(setLoading(true));
    try {
      // Convert Redux state to GraphQL input format
      const itemsArray = Object.entries(verificationProgress.items).map(([_id_item, item]) => ({
        _id_item,
        status: item.status.toUpperCase(),
        qty_expected: item.qty_expected,
        qty_verified: item.qty_verified,
        notes: item.notes,
        substitute_product_id: item.substitute_product?._id,
      }));

      const result = await holdSessionMutation({
        variables: {
          input: {
            _id_session: activeSession._id_session,
            current_progress: {
              items: itemsArray,
              stats: verificationProgress.stats,
            },
            notes,
          },
        },
      });

      const response = result.data?.holdTillVerificationSession;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      // Update Redux state
      dispatch(holdCurrentSession());

      return response;
    } catch (error) {
      console.error('Error holding session:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { holdSession, loading };
};

/**
 * Hook for resuming a held session
 */
export const useResumeTillSession = () => {
  const dispatch = useAppDispatch();
  const [resumeSessionMutation, { loading }] = useMutation(RESUME_TILL_SESSION);

  const resumeSession = async (_id_session: string) => {
    dispatch(setLoading(true));
    try {
      const result = await resumeSessionMutation({
        variables: { _id_session },
      });

      const response = result.data?.resumeTillVerificationSession;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      if (response?.session) {
        // Restore Redux state from held session
        dispatch(
          resumeHeldSession({
            _id_session: response.session._id,
            order_data: response.session.order_data,
          })
        );
      }

      return response;
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { resumeSession, loading };
};

/**
 * Hook for completing verification session
 */
export const useCompleteTillSession = () => {
  const dispatch = useAppDispatch();
  const activeSession = useAppSelector(getActiveSession);
  const verificationProgress = useAppSelector(getVerificationProgress);
  const [completeSessionMutation, { loading }] = useMutation(COMPLETE_TILL_SESSION);

  const completeSession = async (delivery_baskets: string[], notes?: string) => {
    if (!activeSession._id_session) {
      throw new Error('No active session to complete');
    }

    dispatch(setLoading(true));
    try {
      // Convert Redux state to GraphQL input format
      const itemsArray = Object.entries(verificationProgress.items).map(([_id_item, item]) => ({
        _id_item,
        status: item.status.toUpperCase(),
        qty_expected: item.qty_expected,
        qty_verified: item.qty_verified,
        notes: item.notes,
        substitute_product_id: item.substitute_product?._id,
      }));

      const result = await completeSessionMutation({
        variables: {
          input: {
            _id_session: activeSession._id_session,
            verification_data: {
              items: itemsArray,
              stats: verificationProgress.stats,
            },
            delivery_baskets,
            notes,
          },
        },
      });

      const response = result.data?.completeTillVerificationSession;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      // Clear Redux state
      dispatch(endSession());

      return response;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { completeSession, loading };
};

/**
 * Hook for canceling session
 */
export const useCancelTillSession = () => {
  const dispatch = useAppDispatch();
  const activeSession = useAppSelector(getActiveSession);
  const [cancelSessionMutation, { loading }] = useMutation(CANCEL_TILL_SESSION);

  const cancelSession = async (reason: string) => {
    if (!activeSession._id_session) {
      throw new Error('No active session to cancel');
    }

    dispatch(setLoading(true));
    try {
      const result = await cancelSessionMutation({
        variables: {
          input: {
            _id_session: activeSession._id_session,
            reason,
          },
        },
      });

      const response = result.data?.cancelTillVerificationSession;

      if (response?.error) {
        throw new Error(response.error.message);
      }

      // Clear Redux state
      dispatch(endSession());

      return response;
    } catch (error) {
      console.error('Error canceling session:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { cancelSession, loading };
};

/**
 * Hook for getting held sessions
 */
export const useHeldTillSessions = (_id_store: string) => {
  const { data, loading, error, refetch } = useQuery(GET_HELD_SESSIONS, {
    variables: { _id_store },
    skip: !_id_store,
  });

  return {
    sessions: data?.getHeldTillSessions?.sessions || [],
    total: data?.getHeldTillSessions?.total || 0,
    loading,
    error: error || data?.getHeldTillSessions?.error,
    refetch,
  };
};

/**
 * Hook for getting active session on mount (recovery)
 */
export const useActiveTillSession = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useQuery(GET_ACTIVE_SESSION);

  // Auto-restore session if found
  if (data?.getActiveTillSession?.session && !loading) {
    const session = data.getActiveTillSession.session;
    dispatch(
      startSession({
        _id_session: session._id,
        _id_order: session._id_order,
        order_data: session.order_data,
      })
    );
  }

  return {
    session: data?.getActiveTillSession?.session,
    loading,
    error: error || data?.getActiveTillSession?.error,
  };
};

/**
 * Hook for item verification actions
 */
export const useItemVerification = () => {
  const dispatch = useAppDispatch();

  return {
    verifyItem: (itemId: string, qty?: number) => {
      dispatch(verifyItem({ itemId, qty }));
    },
    markMissing: (itemId: string, notes?: string) => {
      dispatch(markItemMissing({ itemId, notes }));
    },
    markMismatch: (itemId: string, qty_verified: number, notes?: string) => {
      dispatch(markItemMismatch({ itemId, qty_verified, notes }));
    },
  };
};