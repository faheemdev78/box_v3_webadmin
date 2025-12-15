'use client'
/**
 * Till Verification POS Component
 * Main POS-style verification screen for item-by-item verification
 * Updated for shift-based order verification system
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { Card, Row, Col, Space, Button, Typography, Modal, Input, message, Progress, Tag, Alert, InputNumber } from 'antd';
import { 
  CloseCircleOutlined, WarningOutlined, ClockCircleOutlined, EditOutlined,
  CheckCircleOutlined, LeftOutlined, ExclamationCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/rStore/hooks';
import { getActiveShift, getCurrentOrder, getTillVerification, setCurrentOrder
} from '@/rStore/slices/tillVerificationSlice';
import { getSettings } from '@/rStore/slices/systemSlice';
import { useStartOrderVerification, useCompleteOrderVerification,
  useMyActiveTillShift, usePrintTillReceipt, useOpenTillShift
} from '@/hooks/useTillVerification';
import { adminRoot } from '@/configs';
import { Avatar, DevBlock, Loader, Table, usePageProps } from '@/components';
import { Page } from '@/template';
// import { ItemVerificationRow } from '@/modules/orders/tillVerification/ItemVerificationRow';
import { BasketSelector } from '@/modules/orders/tillVerification/BasketSelector';
import dayjs from 'dayjs';
import { useVerifyOrderItem, useMarkOrderItemMissing, useMarkOrderItemDamaged, useMarkOrderItemMismatch } from '@/hooks/useTillVerification';
import { __success, __yellow } from '@/lib/consoleHelper';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Helper function to map backend item.status to frontend verification status
 * Backend uses: confirmed, out_of_stock, damaged, requested, picked
 * Frontend needs: verified, missing, damaged, mismatch, pending
 */
const mapItemStatusToVerificationStatus = (item: any): 'verified' | 'missing' | 'damaged' | 'mismatch' | 'pending' => {
  switch (item.status) {
    case 'confirmed':
      // If there's an issue_reason, it's a mismatch, otherwise verified
      return item.issue_reason ? 'mismatch' : 'verified';
    case 'out_of_stock':
      return 'missing';
    case 'damaged':
      return 'damaged';
    case 'requested':
    case 'picked':
    default:
      return 'pending';
  }
};

const getStatusTag = (status:string) => {
  switch (status) {
    case 'verified':
      return (<Tag icon={<CheckCircleOutlined />} color="success">Verified</Tag>);
    case 'missing':
      return (<Tag icon={<CloseCircleOutlined />} color="error">Missing</Tag>);
    case 'mismatch':
      return (<Tag icon={<WarningOutlined />} color="warning">Qty Mismatch</Tag>);
    case 'pending':
    default:
      return (<Tag icon={<ClockCircleOutlined />} color="default">Pending</Tag>);
  }
};


/**
 * Helper function to create verification status object from item
 */
const getVerificationStatusFromItem = (item: any) => ({
  status: mapItemStatusToVerificationStatus(item),
  qty_expected: item.qty,
  qty_verified: item.processed_qty || 0,
  notes: item.issue_reason || '',
  verified_at: item.verified_at || null,
});

function Header({ orderData, handleBack, setShowCompleteModal, completingOrder, verifiedItems }:{
  orderData:any, handleBack:React.MouseEventHandler<HTMLElement>, setShowCompleteModal:Function, completingOrder:boolean, verifiedItems:any
}) {
  // const orderItems = orderData?.current_order?.items || [];
  const customer = orderData?.customer;
  const picker = orderData?.processing_stages?.picking?.handled_by;

  return (<div style={{ marginBottom: 16 }}>
    <Row align="middle" justify="space-between">
      <Col>
        <Space>
          <Button icon={<LeftOutlined />} onClick={handleBack} size="large">Back</Button>
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0 }}>Till Verification - Order #{orderData?.serial}</Title>
            <Text type="secondary">Customer: {customer?.name} | Picker: {picker?.name}</Text>
          </Space>
        </Space>
      </Col>
      <Col>
        <Button onClick={() => setShowCompleteModal(true)} type="primary" size="large" loading={completingOrder} disabled={verifiedItems === 0} icon={<CheckCircleOutlined />}>Complete Verification</Button>
      </Col>
    </Row>
  </div>)
}

function ErrorComp({ title, description, buttons }: { title:string, description:string, buttons?:ReactNode }){
  return (<div style={{ textAlign: 'center', padding: '100px 0' }}><Card><Space direction="vertical">
    <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
    <Title level={4}>{title}</Title>
    <Text>{description}</Text>
    <Space>
      <Button onClick={() => window.location.reload()}>Reload Page</Button>
      {buttons}
      {/* <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Back to Queue</Button> */}
    </Space>
  </Space></Card></div>)
}

const VerificationColumn = ({ item, orderId }: { item:any, orderId:string }) => {
  // Use shared helper function
  const verificationStatus = getVerificationStatusFromItem(item);

  const settings = useAppSelector(getSettings);

  const { verifyItem, loading: verifyLoading } = useVerifyOrderItem();
  const { markMissing, loading: missingLoading } = useMarkOrderItemMissing();
  const { markDamaged, loading: damagedLoading } = useMarkOrderItemDamaged();
  const { markMismatch, loading: mismatchLoading } = useMarkOrderItemMismatch();
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [missingNotes, setMissingNotes] = useState('');
  const [mismatchQty, setMismatchQty] = useState(verificationStatus.qty_verified || 0);
  const [mismatchNotes, setMismatchNotes] = useState('');


  const handleVerify = async () => {
    try {
      await verifyItem(orderId, item._id_product, verificationStatus.qty_expected);
      message.success(`${item.title} verified`);
    } catch (error: any) {
      message.error(error.message || 'Failed to verify item');
    }
  };

  const handleMissing = () => setShowMissingModal(true);

  const confirmMissing = async () => {
    try {
      await markMissing(orderId, item._id_product, missingNotes || 'Item not found');
      message.warning(`${item.title} marked as missing`);
      setShowMissingModal(false);
      setMissingNotes('');
    } catch (error: any) {
      message.error(error.message || 'Failed to mark item as missing');
    }
  };

  const confirmMismatch = async () => {
    if (mismatchQty >= 0 && mismatchQty !== verificationStatus.qty_expected) {
      try {
        await markMismatch(orderId, item._id_product, mismatchQty, mismatchNotes || 'Quantity mismatch');
        message.warning(`${item.title} quantity updated to ${mismatchQty}`);
        setShowMismatchModal(false);
        setMismatchNotes('');
      } catch (error: any) {
        message.error(error.message || 'Failed to mark quantity mismatch');
      }
    }
  };

  const handleMismatch = () => {
    setMismatchQty(0);
    setShowMismatchModal(true);
  };

  // const getCardStyle = () => {
  //   const baseStyle = { marginBottom: 12 };
  //   switch (verificationStatus.status) {
  //     case 'verified':
  //       return { ...baseStyle, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' };
  //     case 'missing':
  //       return { ...baseStyle, backgroundColor: '#fff1f0', borderColor: '#ffa39e' };
  //     case 'mismatch':
  //       return { ...baseStyle, backgroundColor: '#fffbe6', borderColor: '#ffe58f' };
  //     default:
  //       return baseStyle;
  //   }
  // };



  return (<>
    {/* Verification Timestamp */}
    {verificationStatus.verified_at && (<Text type="secondary" style={{ fontSize: 12 }}>Verified at {dayjs(verificationStatus.verified_at).format('HH:mm:ss')}</Text>)}
    {/* <div style={{ textAlign: "center", paddingBottom: "5px" }}>{getStatusTag(verificationStatus.status)}</div> */}

    {/* Action Buttons */}
    <Space style={{ width: '100%' }}>
      <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleVerify} size="large" block style={{ flex: 1 }}>Verify</Button>
      <Button danger icon={<CloseCircleOutlined />} onClick={handleMissing} size="large">Missing</Button>
      <Button icon={<WarningOutlined />} onClick={handleMismatch} size="large">Qty Issue</Button>
    </Space>

    {/* Notes */}
    {verificationStatus.notes && (<Alert message={verificationStatus.notes} style={{ padding:"0px 5px", fontSize:"11px", marginTop:"5px" }} type="info" />)}


    {/* Missing Item Modal */}
    <Modal title={<Text>Mark <Text strong>{item && item.title}</Text> as missing?</Text>}
      open={showMissingModal}
      onOk={confirmMissing}
      onCancel={() => setShowMissingModal(!!missingLoading)}
      okText="Confirm Missing"
      okButtonProps={{ danger: true }}
      loading={missingLoading}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* <Text>Mark <Text strong>{item.title}</Text> as missing?</Text> */}
        <TextArea placeholder="Optional: Reason for missing item..."
          value={missingNotes}
          onChange={(e) => setMissingNotes(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>

    {/* Quantity Mismatch Modal */}
    <Modal title="Quantity Mismatch"
      open={showMismatchModal}
      onOk={confirmMismatch}
      onCancel={() => setShowMismatchModal(!!mismatchLoading)}
      okText="Confirm Quantity"
      okButtonProps={{ disabled: mismatchQty === verificationStatus.qty_expected }}
      loading={mismatchLoading}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>Expected quantity: <Text strong>{verificationStatus.qty_expected}</Text></Text>
        <Space>
          <Text>Actual quantity found:</Text>
          <InputNumber
            min={0}
            max={verificationStatus.qty_expected}
            value={mismatchQty}
            onChange={(value) => setMismatchQty(value || 0)}
            size="large"
            style={{ width: 100 }}
          />
        </Space>
        <TextArea
          placeholder="Optional: Notes about the quantity mismatch..."
          value={mismatchNotes}
          onChange={(e) => setMismatchNotes(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>

  </>)

}


const TillVerificationPOS = ({ shiftSession }: { shiftSession:any }) => {
  // console.log("TillVerificationPOS()")
  const { store, store_id }: any = usePageProps();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams()

  const orderId = params.orderId as string

  const settings = useAppSelector(getSettings);
  const tillVerification = useAppSelector(getTillVerification);
  const activeShift = useAppSelector(getActiveShift);
  const orderData = useAppSelector(getCurrentOrder);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBasketIds, setSelectedBasketIds] = useState<string[]>([]);
  const [completeNotes, setCompleteNotes] = useState('');
  const [initAttempted, setInitAttempted] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptText, setReceiptText] = useState<string>('');
  const [fatelError, setFatelError] = useState<string | null>(null);

  // Mutations
  const { startOrder, called: calledStart } = useStartOrderVerification();
  const { completeOrder, loading: completingOrder } = useCompleteOrderVerification();
  const { printReceipt, loading: printingReceipt } = usePrintTillReceipt();


  // Initialize order verification on mount
  useEffect(() => {
    if (!orderId || calledStart) return;

    // setInitAttempted(true)
    initializeOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, calledStart]);


  const initializeOrder = async () => {
    console.log(__yellow("initializeOrder()"))
    if (calledStart) return;

    if (!orderData) {
      try {
        const result = await startOrder(orderId);
        console.log("result: ", result)

        if (result?.success?.message?.includes('Resuming')) message.info('Resuming order verification');
        else message.success('Order verification started');

      } catch (error: any) {
        console.error('Failed to start order:', error);
        setFatelError(error.message || 'Failed to start order verification');
      }
    } else {
      // Order already in Redux - just set as current
      console.log('Order already in Redux, setting as current');
      dispatch(setCurrentOrder(orderId));
    }
  };

  const handleCompleteWithReceipt = async () => {
    if (!orderData) return;

    // Validate basket selection
    if (selectedBasketIds.length === 0) {
      message.error('Please select at least one delivery basket');
      return;
    }

    try {
      await completeOrder(orderId, selectedBasketIds, completeNotes);
      message.success('Order verification completed successfully!');
      setShowCompleteModal(false);
      setSelectedBasketIds([]);
      setCompleteNotes('');

      // Offer to print receipt
      Modal.confirm({
        title: 'Print Receipt?',
        content: 'Would you like to print the till receipt for this order?',
        okText: 'Print Receipt',
        cancelText: 'Skip',
        icon: <PrinterOutlined />,
        onOk: async () => {
          try {
            const result = await printReceipt(orderId);
            if (result?.receiptText) {
              setReceiptText(result.receiptText);
              setShowReceiptModal(true);
            }
          } catch (error: any) {
            message.error(error.message || 'Failed to print receipt');
            // Still navigate away
            dispatch(setCurrentOrder(null));
            router.push(`${adminRoot}/store/${store_id}/till-verification`);
          }
        },
        onCancel: () => {
          dispatch(setCurrentOrder(null));
          router.push(`${adminRoot}/store/${store_id}/till-verification`);
        },
      });
    } catch (error: any) {
      message.error(error.message || 'Failed to complete verification');
    }
  };

  const handleBasketSelectionChange = (basketIds: string[]) => setSelectedBasketIds(basketIds);

  const handleBack = () => {
    dispatch(setCurrentOrder(null));
    router.push(`${adminRoot}/store/${store_id}/till-verification`);
  };




  if (fatelError) return <Alert message={fatelError} showIcon type='error' />
  if (!orderId || !activeShift) {
    let eInfo = { title:"", description:"" }
    if (!orderId) Object.assign(eInfo, {
      title: "Missing order ID", description: "Unable to find target order ID"
    })
    if (!activeShift && !orderId) Object.assign(eInfo, {
      title: "No Active Shift", description: "You must have an active shift to verify orders."
    })

    return <ErrorComp {...eInfo}
      buttons={<><Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Queue</Button></>}
    />
  }

  // Loading state - show what's happening
  if (!orderData) {
    if (!calledStart) return (<div style={{ textAlign: 'center', padding: '100px 0' }}><Loader loading={true}>Initializing...</Loader></div>);

    return <ErrorComp title="Failed to Load Order" description="Could not load order data. The order might not be available for verification." 
      buttons={<><Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Back to Queue</Button></>}
    />
  }

  const orderItems = orderData?.current_order?.items || [];
  const customer = orderData?.customer;
  const picker = orderData?.processing_stages?.picking?.handled_by;

  // Calculate verification progress
  const totalItems = orderItems.length;
  const verifiedItems = orderItems.filter((item: any) =>
    item.processed_qty > 0 || item.status === 'confirmed' || item.status === 'out_of_stock' || item.status === 'damaged'
  ).length;
  const progressPercent = totalItems > 0 ? (verifiedItems / totalItems) * 100 : 0;
  
  return (<>
    <Page><div style={{ minHeight: '100vh' }}>
      <Header orderData={orderData} handleBack={handleBack} setShowCompleteModal={setShowCompleteModal} completingOrder={completingOrder} verifiedItems={verifiedItems} />
    
      <Row gutter={[10, 10]}>
        <Col xs={24} lg={16}>
          <Table bordered dataSource={orderItems} pagination={false}
            columns={[
              { title: 'Title', dataIndex: 'title', key: 'title', render: (title: string, item: any) => {
                  return (<Space direction='horizontal' size={10}>
                    <Avatar size={72} shape="square">Product</Avatar>
                    <Space direction='vertical' size={0}>
                      <Text strong style={{ fontSize: 16 }}>{title}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>Barcode: {item.barcode}</Text>
                      {item?.attributes?.map((atr: any, i: number) => (<Tag key={i}>{atr.val}{atr.title}</Tag>))}
                    </Space>
                  </Space>)
                }
              },
              { title: 'Quantity', dataIndex: 'qty', key: 'qty', width: 180, render: (title: string, item: any) => {
                  // Use shared helper function
                  const verificationStatus = getVerificationStatusFromItem(item);

                  return (<>
                    <Space>
                      <Text strong style={{ fontSize: 24 }}>{verificationStatus.qty_verified}/{verificationStatus.qty_expected}</Text> x
                      <Text>{settings.currency}{item.price}</Text>
                    </Space>
                    {getStatusTag(verificationStatus.status)}
                    {verificationStatus.status === 'mismatch' && (<Text type="warning">(Found: {verificationStatus.qty_verified})</Text>)}
                  </>)
                }
              },
              { title: 'Total', dataIndex: 'total', key: 'total', width: 100, render: (title: string, item: any) => (<>{settings.currency}{item.total}</>)
              },
              {
                title: 'Verification Status', dataIndex: 'total', key: 'total', width: 100, render: (title: string, item: any) => (<VerificationColumn orderId={orderId} item={item} />)
              },
            ]}
          />
        </Col>

        {/* Right Column - Progress & Summary */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            {/* Progress Card */}
            <Card size="small" title="Verification Progress">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Text strong style={{ fontSize: 16 }}>{verifiedItems} / {totalItems} items</Text>
                <Progress
                  percent={Math.round(progressPercent)}
                  status={verifiedItems === totalItems ? 'success' : 'active'}
                  strokeColor={verifiedItems === totalItems ? '#52c41a' : '#1890ff'}
                />
                <Space>
                  <Tag color="success">{verifiedItems} Verified</Tag>
                  <Tag color="default">{totalItems - verifiedItems} Pending</Tag>
                </Space>
              </Space>
            </Card>

            {/* Order Summary */}
            <Card size="small" title="Order Summary">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>Subtotal:</Text>
                  <Text strong>{settings.currency}{orderData?.current_order?.totals?.subtotal?.toFixed(2) || '0.00'}</Text>
                </Space>
                {orderData?.current_order?.totals?.discountTotal && orderData.current_order.totals.discountTotal > 0 && (<Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text type="secondary">Discount:</Text>
                  <Text type="secondary">-{settings.currency}{orderData?.current_order?.totals?.discountTotal?.toFixed(2)}</Text>
                </Space>)}
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>Tax:</Text>
                  <Text>{settings.currency}{orderData?.current_order?.totals?.taxAmount?.toFixed(2) || '0.00'}</Text>
                </Space>
                <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: 8, marginTop: 8 }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 16 }}>Total:</Text>
                    <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                      {settings.currency}{orderData?.current_order?.totals?.grandTotal?.toFixed(2) || '0.00'}
                    </Text>
                  </Space>
                </div>
              </Space>
            </Card>

            {/* Receipt Preview Card */}
            <Card
              size="small"
              title={
                <Space>
                  <PrinterOutlined />
                  <Text>Receipt Preview</Text>
                </Space>
              }
              styles={{ body: { padding: 0 } }}
            >
              <div style={{
                fontFamily: 'monospace',
                fontSize: 10,
                lineHeight: 1.3,
                backgroundColor: '#fafafa',
                padding: 12,
                maxHeight: 400,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                borderTop: '1px solid #f0f0f0'
              }}>
                {/* Store Header */}
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #999', paddingBottom: 8, marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 11 }}>{store?.name || 'BOX STORE'}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 9 }}>Till Receipt</Text>
                </div>

                {/* Order Info */}
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 9 }}>Order: #{orderData?.serial}</Text>
                  <br />
                  <Text style={{ fontSize: 9 }}>Customer: {customer?.name || 'N/A'}</Text>
                  <br />
                  <Text style={{ fontSize: 9 }}>Date: {dayjs().format('DD/MM/YYYY HH:mm')}</Text>
                  <br />
                  <Text style={{ fontSize: 9 }}>Zone: {(orderData as any)?.zone?.title || 'N/A'}</Text>
                  <br />
                  {(orderData?.current_order as any)?.baskets && (orderData?.current_order as any).baskets.length > 0 && (
                    <Text style={{ fontSize: 9 }}>Baskets: {(orderData?.current_order as any).baskets.map((b: any) => b.title || b.barcode).join(', ')}</Text>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '6px 0', marginBottom: 6 }}>
                  {/* Items Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 1fr', gap: '4px', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #ddd' }}>
                    <Text strong style={{ fontSize: 8 }}>ITEM</Text>
                    <Text strong style={{ fontSize: 8, textAlign: 'right' }}>QTY x PRICE</Text>
                    <Text strong style={{ fontSize: 8, textAlign: 'right' }}>TOTAL</Text>
                  </div>

                  {/* Items */}
                  {orderItems.map((item: any, index: number) => {
                    const qty = item.processed_qty || item.qty;
                    const total = (qty * item.price).toFixed(2);
                    const itemName = item.title?.substring(0, 20) || 'Item';

                    return (
                      <div key={index} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 1fr', gap: '4px', alignItems: 'start' }}>
                          <Text style={{ fontSize: 9 }}>{itemName}</Text>
                          <Text style={{ fontSize: 9, textAlign: 'right' }}>{qty} x {settings.currency}{item.price?.toFixed(2)}</Text>
                          <Text style={{ fontSize: 9, textAlign: 'right' }}>{settings.currency}{total}</Text>
                        </div>
                        <p>{item.status}</p>
                        {item.status === 'out_of_stock' && (
                          <Text type="danger" style={{ fontSize: 8, display: 'block', marginLeft: 4 }}>⚠ MISSING</Text>
                        )}
                        {item.issue_reason && (
                          <Text type="warning" style={{ fontSize: 7, display: 'block', marginLeft: 4, fontStyle: 'italic' }}>Note: {item.issue_reason}</Text>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 9 }}>Subtotal:</Text>
                    <Text style={{ fontSize: 9 }}>{settings.currency}{orderData?.current_order?.totals?.subtotal?.toFixed(2)}</Text>
                  </div>
                  {orderData?.current_order?.totals?.discountTotal && orderData.current_order.totals.discountTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 9 }}>Discount:</Text>
                      <Text style={{ fontSize: 9 }}>-{settings.currency}{orderData?.current_order?.totals?.discountTotal?.toFixed(2)}</Text>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 9 }}>Tax:</Text>
                    <Text style={{ fontSize: 9 }}>{settings.currency}{orderData?.current_order?.totals?.taxAmount?.toFixed(2)}</Text>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #333', paddingTop: 6, marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 10 }}>TOTAL:</Text>
                    <Text strong style={{ fontSize: 10 }}>{settings.currency}{orderData?.current_order?.totals?.grandTotal?.toFixed(2)}</Text>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px dashed #999' }}>
                  <Text type="secondary" style={{ fontSize: 8 }}>Thank you for your order!</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 8 }}>Verified: {verifiedItems}/{totalItems} items</Text>
                </div>
              </div>
            </Card>
          </Space>
        </Col>

      </Row>

    </div></Page>

    {/* Complete Verification Modal */}
    <Modal title="Complete Verification"
      open={showCompleteModal}
      onOk={handleCompleteWithReceipt}
      onCancel={() => {
        setShowCompleteModal(false);
        setSelectedBasketIds([]);
      }}
      okText="Complete Verification"
      confirmLoading={completingOrder}
      width={800}
      okButtonProps={{ disabled: selectedBasketIds.length === 0 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text>Verification Progress: <Text strong>{verifiedItems} / {totalItems} items</Text></Text>
          {verifiedItems < totalItems && (
            <Alert type="warning" showIcon style={{ marginTop: 8 }} message="Not all items have been verified. Continue anyway?" />
          )}
        </div>

        <div>
          <Title level={5} style={{ marginBottom: 12 }}>Select Delivery Baskets</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Select the delivery baskets for this order. Items from pickup baskets will be transferred to these baskets.
          </Text>
          <BasketSelector
            storeId={store_id}
            onSelectionChange={handleBasketSelectionChange}
            minRequired={1}
            category="dispatch"
          />
        </div>

        <TextArea
          placeholder="Optional: Add completion notes..."
          value={completeNotes}
          onChange={(e) => setCompleteNotes(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>

    {/* Receipt Printing Modal */}
    <Modal title="Till Receipt"
      open={showReceiptModal}
      onCancel={() => setShowReceiptModal(false)}
      footer={[
        <Button key="close" onClick={() => setShowReceiptModal(false)}>Close</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />}
          onClick={() => {
            // In a real implementation, this would send to thermal printer
            window.print();
          }}
        >
          Print
        </Button>,
      ]}
      width={600}
    >
      <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4, fontSize: 12, lineHeight: 1.4 }}>
        {receiptText}
      </div>
    </Modal>

    <DevBlock obj={orderData} title="orderData" />
  </>)

}

// export const BK___TillVerificationPOS = () => {
//   const { store, store_id }:any = usePageProps()
//   const params = useParams()
//   const orderId = params.orderId as string

//   const router = useRouter();
//   const dispatch = useAppDispatch();
//   const settings = useAppSelector(getSettings);

//   // Get order from Redux state
//   const orderData = useAppSelector(getCurrentOrder);

//   // Fetch active shift
//   const { session: activeShift, loading: shiftLoading } = useMyActiveTillShift();

//   // Mutations
//   const { startOrder } = useStartOrderVerification();
//   const { completeOrder, loading: completingOrder } = useCompleteOrderVerification();
//   const { printReceipt, loading: printingReceipt } = usePrintTillReceipt();

//   const [showCompleteModal, setShowCompleteModal] = useState(false);
//   const [selectedBasketIds, setSelectedBasketIds] = useState<string[]>([]);
//   const [completeNotes, setCompleteNotes] = useState('');
//   const [initAttempted, setInitAttempted] = useState(false);
//   const [showReceiptModal, setShowReceiptModal] = useState(false);
//   const [receiptText, setReceiptText] = useState<string>('');
//   const [fatelError, setFatelError] = useState<string | null>(null);

//   // Initialize order verification on mount
//   useEffect(() => {
//     if (initAttempted) return;

//     const initializeOrder = async () => {
//       setInitAttempted(true);

//       if (!orderData) {
//         // Order not in Redux - try to start verification
//         // Backend will handle if order is already locked by this user
//         try {
//           console.log('Starting order verification for:', orderId);
//           const result = await startOrder(orderId);
//           console.log("result: ", result)

//           // Check if backend returned "resuming" message
//           if (result?.success?.message?.includes('Resuming')) message.info('Resuming order verification');
//           else message.success('Order verification started');
//         } catch (error: any) {
//           console.error('Failed to start order:', error);
//           message.error(error.message || 'Failed to start order verification');
//           setFatelError(error.message || 'Failed to start order verification');
//         }
//       } else {
//         // Order already in Redux - just set as current
//         console.log('Order already in Redux, setting as current');
//         dispatch(setCurrentOrder(orderId));
//       }
//     };

//     initializeOrder();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [orderId]);

//   const handleComplete = async () => {
//     if (!orderData) return;

//     // Validate basket selection
//     if (selectedBasketIds.length === 0) {
//       message.error('Please select at least one delivery basket');
//       return;
//     }

//     try {
//       await completeOrder(orderId, selectedBasketIds, completeNotes);
//       message.success('Order verification completed successfully!');
//       setShowCompleteModal(false);
//       setSelectedBasketIds([]);
//       setCompleteNotes('');
//       dispatch(setCurrentOrder(null));
//       router.push(`${adminRoot}/store/${store_id}/till-verification`);
//     } catch (error: any) {
//       message.error(error.message || 'Failed to complete verification');
//     }
//   };

//   const handlePrintReceipt = async () => {
//     try {
//       const result = await printReceipt(orderId);
//       if (result?.receiptText) {
//         setReceiptText(result.receiptText);
//         setShowReceiptModal(true);
//         message.success('Receipt generated successfully!');
//       }
//     } catch (error: any) {
//       message.error(error.message || 'Failed to print receipt');
//     }
//   };

//   const handleBasketSelectionChange = (basketIds: string[]) => {
//     setSelectedBasketIds(basketIds);
//   };

//   const handleBack = () => {
//     // Just navigate back - order stays locked (auto-hold)
//     dispatch(setCurrentOrder(null));
//     router.push(`${adminRoot}/store/${store_id}/till-verification`);
//   };

//   // Check if shift is active
//   if (fatelError) return <Alert message={fatelError} showIcon type='error' />

//   if (!activeShift) {
//     return (
//       <div style={{ textAlign: 'center', padding: '100px 0' }}>
//         <Card>
//           <Space direction="vertical">
//             <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
//             <Title level={4}>No Active Shift</Title>
//             <Text>You must have an active shift to verify orders.</Text>
//             <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Queue</Button>
//           </Space>
//         </Card>
//       </div>
//     );
//   }

//   // Loading state - show what's happening
//   if (!orderData) {
//     if (!initAttempted) return (<div style={{ textAlign: 'center', padding: '100px 0' }}><Loader loading={true}>Initializing...</Loader></div>);

//     return (<div style={{ textAlign: 'center', padding: '100px 0' }}>
//       <Card>
//         <Space direction="vertical">
//           <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
//           <Title level={4}>Failed to Load Order</Title>
//           <Text>Could not load order data. The order might not be available for verification.</Text>
//           <Space>
//             <Button onClick={() => window.location.reload()}>Reload Page</Button>
//             <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Back to Queue</Button>
//           </Space>
//         </Space>
//       </Card>
//     </div>);
//   }


//   const orderItems = orderData?.current_order?.items || [];
//   const customer = orderData?.customer;
//   const picker = orderData?.processing_stages?.picking?.handled_by;

//   // Calculate verification progress
//   const totalItems = orderItems.length;
//   const verifiedItems = orderItems.filter((item: any) =>
//     item.processed_qty > 0 || item.status === 'confirmed' || item.status === 'out_of_stock' || item.status === 'damaged'
//   ).length;
//   const progressPercent = totalItems > 0 ? (verifiedItems / totalItems) * 100 : 0;

//   return (<Page>
//     <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
//       {/* Header */}
//       <div style={{ marginBottom: 16 }}>
//         <Row align="middle" justify="space-between">
//           <Col>
//             <Space>
//               <Button icon={<LeftOutlined />} onClick={handleBack} size="large">Back</Button>
//               <Space direction="vertical" size={0}>
//                 <Title level={3} style={{ margin: 0 }}>Till Verification - Order #{orderData?.serial}</Title>
//                 <Text type="secondary">Customer: {customer?.name} | Picker: {picker?.name}</Text>
//               </Space>
//             </Space>
//           </Col>
//           <Col>
//             <Button
//               type="primary" size="large" loading={completingOrder} disabled={verifiedItems === 0}
//               icon={<CheckCircleOutlined />}
//               onClick={() => setShowCompleteModal(true)}
//             >
//               Complete Verification
//             </Button>
//           </Col>
//         </Row>
//       </div>

//       {/* Main Content */}
//       <Row gutter={16}>
//         {/* Left Column - Items List */}
//         <Col xs={24} lg={16}>
//           <Card title={<Title level={4} style={{ margin: 0 }}>Items to Verify</Title>} style={{ minHeight: '70vh' }}>
//             <Space direction="vertical" style={{ width: '100%' }}>
//               {orderItems.map((item: any) => (
//                 <ItemVerificationRow
//                   key={item._id_product}
//                   item={item}
//                   verificationStatus={getVerificationStatusFromItem(item)}
//                   orderId={orderId}
//                 />
//               ))}
//             </Space>
//           </Card>
//         </Col>

//         {/* Right Column - Progress & Summary */}
//         <Col xs={24} lg={8}>
//           <Space direction="vertical" style={{ width: '100%' }} size="middle">
//             {/* Progress Card */}
//             <Card size="small" title="Verification Progress">
//               <Space direction="vertical" style={{ width: '100%' }} size="small">
//                 <Text strong style={{ fontSize: 16 }}>{verifiedItems} / {totalItems} items</Text>
//                 <Progress
//                   percent={Math.round(progressPercent)}
//                   status={verifiedItems === totalItems ? 'success' : 'active'}
//                   strokeColor={verifiedItems === totalItems ? '#52c41a' : '#1890ff'}
//                 />
//                 <Space>
//                   <Tag color="success">{verifiedItems} Verified</Tag>
//                   <Tag color="default">{totalItems - verifiedItems} Pending</Tag>
//                 </Space>
//               </Space>
//             </Card>

//             {/* Order Summary */}
//             <Card size="small" title="Order Summary">
//               <Space direction="vertical" style={{ width: '100%' }} size="small">
//                 <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//                   <Text>Subtotal:</Text>
//                   <Text strong>{settings.currency}{orderData?.current_order?.totals?.subTotal?.toFixed(2) || '0.00'}</Text>
//                 </Space>
//                 {orderData?.current_order?.totals?.discount > 0 && (
//                   <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//                     <Text type="secondary">Discount:</Text>
//                     <Text type="secondary">-{settings.currency}{orderData?.current_order?.totals?.discount?.toFixed(2)}</Text>
//                   </Space>
//                 )}
//                 <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//                   <Text>Tax:</Text>
//                   <Text>{settings.currency}{orderData?.current_order?.totals?.tax?.toFixed(2) || '0.00'}</Text>
//                 </Space>
//                 <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: 8, marginTop: 8 }}>
//                   <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//                     <Text strong style={{ fontSize: 16 }}>Total:</Text>
//                     <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
//                       {settings.currency}{orderData?.current_order?.totals?.grandTotal?.toFixed(2) || '0.00'}
//                     </Text>
//                   </Space>
//                 </div>
//               </Space>
//             </Card>

//             {/* Tips Card */}
//             <Card size="small" title="💡 Tips" styles={{ body: { padding: 12 } }}>
//               <Space direction="vertical" size="small">
//                 <Text type="secondary" style={{ fontSize: 12 }}>• Navigate away to auto-hold this order</Text>
//                 <Text type="secondary" style={{ fontSize: 12 }}>• Verify items by clicking the Verify button</Text>
//                 <Text type="secondary" style={{ fontSize: 12 }}>• Mark issues using Missing/Qty Issue buttons</Text>
//               </Space>
//             </Card>
//           </Space>
//         </Col>
//       </Row>

//       {/* Complete Verification Modal */}
//       <Modal
//         title="Complete Verification"
//         open={showCompleteModal}
//         onOk={handleComplete}
//         onCancel={() => {
//           setShowCompleteModal(false);
//           setSelectedBasketIds([]);
//         }}
//         okText="Complete Verification"
//         confirmLoading={completingOrder}
//         width={800}
//         okButtonProps={{ disabled: selectedBasketIds.length === 0 }}
//       >
//         <Space direction="vertical" style={{ width: '100%' }} size="large">
//           <div>
//             <Text>Verification Progress: <Text strong>{verifiedItems} / {totalItems} items</Text></Text>
//             {verifiedItems < totalItems && (
//               <Alert type="warning" showIcon style={{ marginTop: 8 }} message="Not all items have been verified. Continue anyway?" />
//             )}
//           </div>

//           <div>
//             <Title level={5} style={{ marginBottom: 12 }}>Select Delivery Baskets</Title>
//             <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
//               Select the delivery baskets for this order. Items from pickup baskets will be transferred to these baskets.
//             </Text>
//             <BasketSelector
//               storeId={store_id}
//               onSelectionChange={handleBasketSelectionChange}
//               minRequired={1}
//               category="dispatch"
//             />
//           </div>

//           <TextArea
//             placeholder="Optional: Add completion notes..."
//             value={completeNotes}
//             onChange={(e) => setCompleteNotes(e.target.value)}
//             rows={3}
//           />
//         </Space>
//       </Modal>

//       {/* Receipt Printing Modal */}
//       <Modal
//         title="Till Receipt"
//         open={showReceiptModal}
//         onCancel={() => setShowReceiptModal(false)}
//         footer={[
//           <Button key="close" onClick={() => setShowReceiptModal(false)}>Close</Button>,
//           <Button key="print" type="primary" icon={<PrinterOutlined />}
//             onClick={() => {
//               // In a real implementation, this would send to thermal printer
//               window.print();
//             }}
//           >
//             Print
//           </Button>,
//         ]}
//         width={600}
//       >
//         <div style={{
//           fontFamily: 'monospace',
//           whiteSpace: 'pre-wrap',
//           backgroundColor: '#f5f5f5',
//           padding: 16,
//           borderRadius: 4,
//           fontSize: 12,
//           lineHeight: 1.4
//         }}>
//           {receiptText}
//         </div>
//       </Modal>
//     </div>
//   </Page>);
// };


function TillVerificationPOS_Wrapper() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string
  const { store, store_id }: any = usePageProps();

  const [activity, setActivity] = useState("Loading session...")
  const [fatelError, setFatelError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  // const [openAttempted, setOpenAttempted] = useState(false);
  // const tillVerification = useAppSelector(getTillVerification);
  // const activeShift = useAppSelector(getActiveShift);

  const { session: shiftSession, loading: shiftLoading, error: shiftError, refetch: refetchShift } = useMyActiveTillShift();
  const { openShift, loading: openingShift } = useOpenTillShift();

  useEffect(() => {
    if(shiftSession){
      console.log(__success("shiftSession FOUND"))
      // setReady(true)
    }
    
    if (!shiftSession && !shiftLoading){
      console.log("Shift Sesson not found!!")
      attemptOpenShift();
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftSession, shiftLoading]);


  const attemptOpenShift = async () => {
    console.log(__yellow("attemptOpenShift()"))
    if (openingShift || shiftSession || shiftLoading) return;
    setActivity("Starting a new session...")

    // setOpenAttempted(true);
    try {
      await openShift(store_id);
      // console.log('✅ Shift opened successfully, refetching...');
      // message.success('Shift started automatically');
      // await refetchShift();
    } catch (error) {
      console.error('❌ Failed to open shift:', error);
      setFatelError((error as Error).message || 'Failed to open shift automatically');
    } finally {
      // setActivity("New session started....")
      // setIsOpeningShift(false);
    }
  };



  if (fatelError) return (<Page><div style={{ textAlign: 'center', padding: '100px 0' }}><Card>
    <Space direction="vertical" align="center">
      <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
      <Title level={4}>Session Required</Title>
      <Text>{fatelError}</Text>
      <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Till Queue</Button>
    </Space>
  </Card></div></Page>);

  if (shiftLoading || openingShift) return <Loader loading={true}><div style={{ textAlign: "center" }}>{activity || "Loading..."}</div></Loader>
  // if (!ready) return <Loader loading={true}><div style={{ textAlign: "center" }}>Preparing...</div></Loader>

  if (!shiftSession) return (<Page><div style={{ textAlign: 'center', padding: '100px 0' }}><Card>
    <Space direction="vertical" align="center">
      <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
      <Title level={4}>No active shift found!</Title>
      <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Till Queue</Button>
    </Space>
  </Card></div></Page>);

  if (!orderId) return (<Page><div style={{ textAlign: 'center', padding: '100px 0' }}><Card>
    <Space direction="vertical" align="center">
      <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
      <Title level={4}>Order ID not found!</Title>
      <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Till Queue</Button>
    </Space>
  </Card></div></Page>);


  return (<>
    <TillVerificationPOS 
      shiftSession={shiftSession}
    />
  </>)
}

export default TillVerificationPOS_Wrapper;

// export default TillVerificationPOS;
