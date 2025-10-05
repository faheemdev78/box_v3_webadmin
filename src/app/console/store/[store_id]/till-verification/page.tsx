/**
 * Till Verification Queue Page
 * Route: /console/store/[store_id]/till-verification
 */

// 'use client';

// import React from 'react';
import { TillOrdersQueue } from '@_/modules/orders/tillVerification/TillOrdersQueue';

export default async function TillVerificationQueuePage({ params }) {
  const { store_id } = await params;

  return <TillOrdersQueue _id_store={store_id} />;
}