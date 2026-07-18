'use client';

import ReceiptPreviewAction from '@/components/receipts/ReceiptPreviewAction';

export default function BoxReceiptPreviewButton({
  orderId,
  orderSerial,
}: {
  orderId: string;
  orderSerial: string;
}) {
  return (
    <ReceiptPreviewAction
      kind="box"
      orderId={orderId}
      orderSerial={orderSerial}
      buttonLabel="Box receipt"
    />
  );
}