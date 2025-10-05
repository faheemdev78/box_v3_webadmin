'use client'
/**
 * Till Verification POS Component
 * Main POS-style verification screen for item-by-item verification
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Button, Typography, Modal, Input, Spin, message } from 'antd';
import { PauseCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@_/rStore/hooks';
import { getActiveSession, getVerificationItems, getSessionOrderData, getSessionStoreId } from '@_/rStore/slices/tillVerificationSlice';
import { getSettings } from '@_/rStore/slices/systemSlice';
import { useStartTillSession, useHoldTillSession, useCompleteTillSession, useCancelTillSession } from '@_/hooks/useTillVerification';
import { VerificationProgress } from './VerificationProgress';
import { ItemVerificationRow } from './ItemVerificationRow';
import { HeldSessionsPanel } from './HeldSessionsPanel';
import { Loader } from '@_/components';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TillVerificationPOSProps {
  orderId: string;
  store_id: string; // fallback from route params
}

export const TillVerificationPOS: React.FC<TillVerificationPOSProps> = ({ orderId, store_id: routeStoreId }) => {
  const router = useRouter();
  const settings = useAppSelector(getSettings);

  const activeSession = useAppSelector(getActiveSession);
  const orderData = useAppSelector(getSessionOrderData);
  const verificationItems = useAppSelector(getVerificationItems);
  const sessionStoreId = useAppSelector(getSessionStoreId);

  // Use store_id from Redux if session is active, otherwise use route param
  const store_id = sessionStoreId || routeStoreId;

  const { startTillSession, loading: startLoading } = useStartTillSession();
  const { holdSession, loading: holdLoading } = useHoldTillSession();
  const { completeSession, loading: completeLoading } = useCompleteTillSession();
  const { cancelSession, loading: cancelLoading } = useCancelTillSession();

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [holdNotes, setHoldNotes] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!activeSession._id_session && !sessionInitialized) {
        try {
          setSessionInitialized(true);
          await startTillSession(orderId);
          message.success('Till verification session started');
        } catch (error: any) {
          message.error(error.message || 'Failed to start session');
          router.push(`/console/store/${store_id}/till-verification`);
        }
      }
    };

    initializeSession();
  }, [orderId, activeSession._id_session, sessionInitialized]);

  const handleHold = async () => {
    try {
      await holdSession(holdNotes);
      message.success('Session held successfully');
      setShowHoldModal(false);
      setHoldNotes('');
      router.push(`/console/store/${store_id}/till-verification`);
    } catch (error: any) {
      message.error(error.message || 'Failed to hold session');
    }
  };

  const handleComplete = async () => {
    try {
      // TODO: Add delivery basket selection
      const deliveryBaskets: string[] = [];
      await completeSession(deliveryBaskets, completeNotes);
      message.success('Verification completed successfully!');
      setShowCompleteModal(false);
      setCompleteNotes('');
      router.push(`/console/store/${store_id}/till-verification`);
    } catch (error: any) {
      message.error(error.message || 'Failed to complete session');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      message.warning('Please provide a reason for cancellation');
      return;
    }

    try {
      await cancelSession(cancelReason);
      message.info('Session cancelled');
      setShowCancelModal(false);
      setCancelReason('');
      router.push(`/console/store/${store_id}/till-verification`);
    } catch (error: any) {
      message.error(error.message || 'Failed to cancel session');
    }
  };

  const handleBack = () => {
    Modal.confirm({
      title: 'Leave Verification?',
      content: 'You have an active verification session. Do you want to hold it or cancel?',
      okText: 'Hold Session',
      cancelText: 'Stay',
      onOk: () => setShowHoldModal(true),
    });
  };

  if (startLoading || !orderData) {
    return (<div style={{ textAlign: 'center', padding: '100px 0' }}>
      <Loader loading={true}>Starting verification session...</Loader>
    </div>);
  }

  const orderItems = orderData?.current_order?.items || [];
  const customer = orderData?.customer;
  const picker = orderData?.processing_stages?.picking?.handled_by;

  return (
    <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
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
            <Space>
              <Button icon={<PauseCircleOutlined />} onClick={() => setShowHoldModal(true)} loading={holdLoading} size="large">Hold</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setShowCompleteModal(true)} loading={completeLoading} size="large">Complete</Button>
              <Button danger icon={<CloseCircleOutlined />} onClick={() => setShowCancelModal(true)} loading={cancelLoading} size="large">Cancel</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Row gutter={16}>
        {/* Left Column - Items List */}
        <Col xs={24} lg={16}>
          <Card title={<Title level={4} style={{ margin: 0 }}>Items to Verify</Title>} style={{ minHeight: '70vh' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {orderItems.map((item: any) => {
                const verificationStatus = verificationItems[item._id_product] || {
                  status: 'pending',
                  qty_expected: item.qty,
                  qty_verified: 0,
                  notes: '',
                  verified_at: null,
                };

                return (
                  <ItemVerificationRow key={item._id_product} item={item} verificationStatus={verificationStatus} />
                );
              })}
            </Space>
          </Card>
        </Col>

        {/* Right Column - Progress & Held Sessions */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Progress */}
            <VerificationProgress />

            {/* Held Sessions */}
            <HeldSessionsPanel _id_store={store_id} />

            {/* Order Summary */}
            <Card size="small" title="Order Summary">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>Subtotal:</Text>
                  <Text strong>{settings.currency}{orderData?.current_order?.totals?.subTotal?.toFixed(2) || '0.00'}</Text>
                </Space>
                {orderData?.current_order?.totals?.discount > 0 && (
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Discount:</Text>
                    <Text type="secondary">-{settings.currency}{orderData?.current_order?.totals?.discount?.toFixed(2)}</Text>
                  </Space>
                )}
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>Tax:</Text>
                  <Text>{settings.currency}{orderData?.current_order?.totals?.tax?.toFixed(2) || '0.00'}</Text>
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
          </Space>
        </Col>
      </Row>

      {/* Hold Session Modal */}
      <Modal
        title="Hold Verification Session"
        open={showHoldModal}
        onOk={handleHold}
        onCancel={() => setShowHoldModal(false)}
        okText="Hold Session"
        confirmLoading={holdLoading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Your progress will be saved and you can resume this verification later.</Text>
          <TextArea
            placeholder="Optional: Add notes about why you're holding this session..."
            value={holdNotes}
            onChange={(e) => setHoldNotes(e.target.value)}
            rows={3}
          />
        </Space>
      </Modal>

      {/* Complete Session Modal */}
      <Modal
        title="Complete Verification"
        open={showCompleteModal}
        onOk={handleComplete}
        onCancel={() => setShowCompleteModal(false)}
        okText="Complete Verification"
        confirmLoading={completeLoading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Are you sure you want to complete this verification?</Text>
          <TextArea
            placeholder="Optional: Add completion notes..."
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
            rows={3}
          />
        </Space>
      </Modal>

      {/* Cancel Session Modal */}
      <Modal
        title="Cancel Verification"
        open={showCancelModal}
        onOk={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        okText="Cancel Session"
        okButtonProps={{ danger: true }}
        confirmLoading={cancelLoading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="danger">This will cancel the verification session and release the order.</Text>
          <TextArea
            placeholder="Required: Reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default TillVerificationPOS;