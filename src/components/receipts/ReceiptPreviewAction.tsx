'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Alert, Modal, Spin } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useLazyQuery } from '@apollo/client/react';
import { Button } from '@/components';
import RECEIPT_ORDER_DETAILS from '@/graphql/order/receiptOrderDetails.graphql';
import OrderReceipt from '@/components/receipts/OrderReceipt';
import ProductReceipt from '@/components/receipts/ProductReceipt';
import { printReceiptElement } from '@/components/receipts/printReceiptElement';

export type ReceiptPreviewKind = 'box' | 'product';

type ReceiptPreviewActionProps = {
  kind: ReceiptPreviewKind;
  orderId: string;
  orderSerial: string;
  buttonLabel: string;
};

export default function ReceiptPreviewAction({
  kind,
  orderId,
  orderSerial,
  buttonLabel,
}: ReceiptPreviewActionProps) {
  const [open, setOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [fetchReceiptOrder, { data, loading, error }] = useLazyQuery<any>(
    RECEIPT_ORDER_DETAILS,
    { fetchPolicy: 'network-only' }
  );

  const order = data?.orderDetails;
  const tillVerification = order?.processing_stages?.till_verification;
  const receiptOrder = useMemo(() => {
    if (!order || !tillVerification) return null;

    return {
      ...order,
      current_order: tillVerification,
    };
  }, [order, tillVerification]);

  const apiError = order?.error?.message;
  const errorMessage = error?.message || apiError;
  const title = kind === 'box'
    ? 'Box Receipt - ' + orderSerial
    : 'Product Receipt - ' + orderSerial;

  const handleOpen = () => {
    setOpen(true);
    void fetchReceiptOrder({
      variables: {
        filter: JSON.stringify({ _id: orderId }),
      },
    });
  };

  const handlePrint = async () => {
    if (!receiptRef.current) return;

    try {
      await printReceiptElement(receiptRef.current);
    } catch (printError: any) {
      Modal.error({
        title: 'Unable to print receipt',
        content: printError?.message || 'Print failed',
      });
    }
  };

  return (
    <>
      <Button size="small" onClick={handleOpen}>{buttonLabel}</Button>

      <Modal
        title={title}
        open={open}
        onCancel={() => setOpen(false)}
        width={420}
        destroyOnHidden
        footer={[
          <Button key="close" onClick={() => setOpen(false)}>Close</Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => void handlePrint()}
            disabled={!receiptOrder || loading || !!errorMessage}
          >
            Print
          </Button>,
        ]}
      >
        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: 32,
            }}
          >
            <Spin />
            <span>Loading full order receipt...</span>
          </div>
        )}

        {!loading && errorMessage && (
          <Alert
            type="error"
            showIcon
            message="Unable to load receipt"
            description={errorMessage}
          />
        )}

        {!loading && !errorMessage && order && !tillVerification && (
          <Alert
            type="warning"
            showIcon
            message="Till verification receipt is unavailable"
            description="This order does not contain processing_stages.till_verification data."
          />
        )}

        {!loading && !errorMessage && receiptOrder && (
          kind === 'box'
            ? <OrderReceipt orderData={receiptOrder} ref={receiptRef} />
            : <ProductReceipt orderData={receiptOrder} ref={receiptRef} />
        )}
      </Modal>
    </>
  );
}