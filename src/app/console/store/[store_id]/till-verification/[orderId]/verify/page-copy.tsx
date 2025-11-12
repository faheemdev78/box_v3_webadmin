/**
 * Till Verification POS Page
 * Route: /console/store/[store_id]/till-verification/[orderId]/verify
 */

// 'use client';

// import React from 'react';
// import { useParams } from 'next/navigation';
import { TillVerificationPOS } from '@_/modules/orders/tillVerification/TillVerificationPOS';

export default async function TillVerificationPOSPage({ params }) {
  // const params = useParams();
  // const orderId = params.orderId as string;
  
  const { store_id, orderId } = await params;

  if (!orderId) return <div>Invalid order ID</div>;

  return <TillVerificationPOS orderId={orderId} store_id={store_id} />;
}