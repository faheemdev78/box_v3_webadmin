/**
 * Till Verification Queue Page
 * Route: /console/store/[store_id]/till-verification
 */

// 'use client';

// import React from 'react';
import { OrdersList } from './components/ordersList.tsx';

export default async function OrdersReadyToDispatchPage({ params }) {
  const { store_id } = await params;

  return <OrdersList _id_store={store_id} />;
}