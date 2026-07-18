'use client';

import ReceiptPreviewAction from '@/components/receipts/ReceiptPreviewAction';

export default function ProductReceiptPreviewButton({
  orderId,
  orderSerial,
}: {
  orderId: string;
  orderSerial: string;
}) {
  return (
    <ReceiptPreviewAction
      kind="product"
      orderId={orderId}
      orderSerial={orderSerial}
      buttonLabel="Product receipt"
    />
  );
}