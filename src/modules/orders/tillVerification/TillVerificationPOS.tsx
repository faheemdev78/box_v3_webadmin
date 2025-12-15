// 'use client'
// /**
//  * Till Verification POS Component
//  * Main POS-style verification screen for item-by-item verification
//  * Updated for shift-based order verification system
//  */

// import React, { useEffect, useState } from 'react';
// import { Card, Row, Col, Space, Button, Typography, Modal, Input, message, Progress, Tag, Alert } from 'antd';
// import { CheckCircleOutlined, LeftOutlined, ExclamationCircleOutlined, PrinterOutlined } from '@ant-design/icons';
// import { useRouter } from 'next/navigation';
// import { useAppSelector, useAppDispatch } from '@/rStore/hooks';
// import { getActiveShift, getCurrentOrderId, setCurrentOrder } from '@/rStore/slices/tillVerificationSlice';
// import { getSettings } from '@/rStore/slices/systemSlice';
// import {
//   useStartOrderVerification,
//   useCompleteOrderVerification,
//   useMyLockedOrders,
//   useMyActiveTillShift,
//   usePrintTillReceipt
// } from '@/hooks/useTillVerification';
// import { ItemVerificationRow } from './ItemVerificationRow';
// import { BasketSelector } from './BasketSelector';
// import { Loader } from '@/components';
// import { adminRoot } from '@/configs';

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// interface TillVerificationPOSProps {
//   orderId: string;
//   store_id: string;
// }

// export const TillVerificationPOS: React.FC<TillVerificationPOSProps> = ({ orderId, store_id }) => {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//   const settings = useAppSelector(getSettings);
//   const currentOrderId = useAppSelector(getCurrentOrderId);

//   // Fetch active shift and locked orders
//   const { session: activeShift, loading: shiftLoading } = useMyActiveTillShift();
//   const { orders: lockedOrders, loading: loadingOrders, refetch } = useMyLockedOrders();

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

//   // Find current order from locked orders
//   const orderData = lockedOrders.find((o: any) => o._id === orderId);

//   // Initialize order verification on mount
//   useEffect(() => {
//     if (initAttempted || loadingOrders) return;

//     const initializeOrder = async () => {
//       setInitAttempted(true);

//       if (!orderData) {
//         // Order not in locked orders - try to start verification
//         try {
//           console.log('Starting order verification for:', orderId);
//           await startOrder(orderId);
//           dispatch(setCurrentOrder(orderId));
//           message.success('Order verification started');
//         } catch (error: any) {
//           console.error('Failed to start order:', error);
//           message.error(error.message || 'Failed to start order verification');
//           router.push(`${adminRoot}/store/${store_id}/till-verification`);
//         }
//       } else {
//         // Order already locked - just set as current
//         console.log('Order already locked, setting as current');
//         dispatch(setCurrentOrder(orderId));
//       }
//     };

//     initializeOrder();
//   }, [orderId, loadingOrders, orderData, initAttempted, dispatch, startOrder, router, store_id]);

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
//   if (!activeShift) {
//     return (
//       <div style={{ textAlign: 'center', padding: '100px 0' }}>
//         <Card>
//           <Space direction="vertical">
//             <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
//             <Title level={4}>No Active Shift</Title>
//             <Text>You must have an active shift to verify orders.</Text>
//             <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>
//               Go to Queue
//             </Button>
//           </Space>
//         </Card>
//       </div>
//     );
//   }

//   // Loading state - show what's happening
//   if (loadingOrders || (!orderData && !initAttempted)) {
//     return (
//       <div style={{ textAlign: 'center', padding: '100px 0' }}>
//         <Loader loading={true}>
//           {loadingOrders ? 'Loading locked orders...' : 'Initializing...'}
//         </Loader>
//       </div>
//     );
//   }

//   // If init attempted but still no order data, show error
//   if (!orderData && initAttempted) {
//     return (
//       <div style={{ textAlign: 'center', padding: '100px 0' }}>
//         <Card>
//           <Space direction="vertical">
//             <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
//             <Title level={4}>Failed to Load Order</Title>
//             <Text>Could not load order data. The order might not be available for verification.</Text>
//             <Space>
//               <Button onClick={() => window.location.reload()}>Reload Page</Button>
//               <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>
//                 Back to Queue
//               </Button>
//             </Space>
//           </Space>
//         </Card>
//       </div>
//     );
//   }

//   const orderItems = orderData?.current_order?.items || [];
//   const customer = orderData?.customer;
//   const picker = orderData?.processing_stages?.picking?.handled_by;

//   // Calculate verification progress
//   const totalItems = orderItems.length;
//   const verifiedItems = orderItems.filter((item: any) => item.processed_qty > 0 || item.verification_status).length;
//   const progressPercent = totalItems > 0 ? (verifiedItems / totalItems) * 100 : 0;

//   return (
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
//               type="primary"
//               icon={<CheckCircleOutlined />}
//               onClick={() => setShowCompleteModal(true)}
//               loading={completingOrder}
//               size="large"
//               disabled={verifiedItems === 0}
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
//               {orderItems.map((item: any) => {
//                 // Get verification status from order item
//                 const verificationStatus = {
//                   status: item.verification_status || 'pending',
//                   qty_expected: item.qty,
//                   qty_verified: item.processed_qty || 0,
//                   notes: item.verification_notes || '',
//                   verified_at: item.verified_at || null,
//                 };

//                 return (
//                   <ItemVerificationRow
//                     key={item._id_product}
//                     item={item}
//                     verificationStatus={verificationStatus}
//                     orderId={orderId}
//                   />
//                 );
//               })}
//             </Space>
//           </Card>
//         </Col>

//         {/* Right Column - Progress & Summary */}
//         <Col xs={24} lg={8}>
//           <Space direction="vertical" style={{ width: '100%' }} size="middle">
//             {/* Progress Card */}
//             <Card size="small" title="Verification Progress">
//               <Space direction="vertical" style={{ width: '100%' }} size="small">
//                 <div>
//                   <Text strong style={{ fontSize: 16 }}>
//                     {verifiedItems} / {totalItems} items
//                   </Text>
//                 </div>
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
//                 <Text type="secondary" style={{ fontSize: 12 }}>
//                   • Navigate away to auto-hold this order
//                 </Text>
//                 <Text type="secondary" style={{ fontSize: 12 }}>
//                   • Verify items by clicking the Verify button
//                 </Text>
//                 <Text type="secondary" style={{ fontSize: 12 }}>
//                   • Mark issues using Missing/Qty Issue buttons
//                 </Text>
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
//             <Text>
//               Verification Progress: <Text strong>{verifiedItems} / {totalItems} items</Text>
//             </Text>
//             {verifiedItems < totalItems && (
//               <Alert
//                 message="Not all items have been verified. Continue anyway?"
//                 type="warning"
//                 showIcon
//                 style={{ marginTop: 8 }}
//               />
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
//           <Button key="close" onClick={() => setShowReceiptModal(false)}>
//             Close
//           </Button>,
//           <Button
//             key="print"
//             type="primary"
//             icon={<PrinterOutlined />}
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
//   );
// };

// export default TillVerificationPOS;
