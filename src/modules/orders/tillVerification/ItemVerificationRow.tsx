/**
 * Item Verification Row Component
 * Individual item row with verification actions
 * Updated for new till verification system
 */

import React, { useState } from 'react';
import { Card, Space, Button, Typography, Tag, Input, Modal, InputNumber, message, Row, Col } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, ClockCircleOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from '@_/rStore/hooks';
import { getSettings } from '@_/rStore/slices/systemSlice';
import { useVerifyOrderItem, useMarkOrderItemMissing, useMarkOrderItemDamaged, useMarkOrderItemMismatch } from '@_/hooks/useTillVerification';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

interface ItemVerificationRowProps {
  item: {
    _id_product: string;
    title: string;
    barcode?: string;
    qty: number;
    price: number;
    total: number;
  };
  verificationStatus: {
    status: 'pending' | 'verified' | 'missing' | 'damaged' | 'mismatch';
    qty_expected: number;
    qty_verified: number;
    notes: string;
    verified_at: Date | null;
  };
  orderId: string;
}

export const ItemVerificationRow: React.FC<ItemVerificationRowProps> = ({ item, verificationStatus, orderId }) => {
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

  const handleMismatch = () => {
    setMismatchQty(0);
    setShowMismatchModal(true);
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

  const getStatusTag = () => {
    switch (verificationStatus.status) {
      case 'verified':
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">Verified</Tag>
        );
      case 'missing':
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">Missing</Tag>
        );
      case 'mismatch':
        return (
          <Tag icon={<WarningOutlined />} color="warning">Qty Mismatch</Tag>
        );
      case 'pending':
      default:
        return (
          <Tag icon={<ClockCircleOutlined />} color="default">Pending</Tag>
        );
    }
  };

  const getCardStyle = () => {
    const baseStyle = { marginBottom: 12 };
    switch (verificationStatus.status) {
      case 'verified':
        return { ...baseStyle, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' };
      case 'missing':
        return { ...baseStyle, backgroundColor: '#fff1f0', borderColor: '#ffa39e' };
      case 'mismatch':
        return { ...baseStyle, backgroundColor: '#fffbe6', borderColor: '#ffe58f' };
      default:
        return baseStyle;
    }
  };

  return (<>
    <Card size="small" style={getCardStyle()}>
      <Row gutter={[5, 5]}>
        <Col span={8}>Avatar</Col>
        <Col span={8}>Product</Col>
        <Col span={8}>Qty</Col>
        <Col span={8}>Price</Col>
      </Row>

      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* Item Info */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
            {item.barcode && (<Text type="secondary" style={{ fontSize: 12 }}>Barcode: {item.barcode}</Text>)}
          </Space>
          {getStatusTag()}
        </Space>

        {/* Quantity and Price */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Text>Qty: <Text strong>{verificationStatus.qty_expected}</Text></Text>
            {verificationStatus.status === 'mismatch' && (<Text type="warning">(Found: {verificationStatus.qty_verified})</Text>)}
          </Space>
          <Text strong style={{ fontSize: 16 }}>{settings.currency}{item.total?.toFixed(2)}</Text>
        </Space>

        {/* Verification Timestamp */}
        {verificationStatus.verified_at && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Verified at {dayjs(verificationStatus.verified_at).format('HH:mm:ss')}
          </Text>
        )}

        {/* Notes */}
        {verificationStatus.notes && (
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EditOutlined /> {verificationStatus.notes}
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        {verificationStatus.status === 'pending' && (
          <Space style={{ width: '100%' }}>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleVerify} size="large" block style={{ flex: 1 }}>Verify</Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={handleMissing} size="large">Missing</Button>
            <Button icon={<WarningOutlined />} onClick={handleMismatch} size="large">Qty Issue</Button>
          </Space>
        )}
      </Space>
    </Card>

    {/* Missing Item Modal */}
    <Modal
      title="Mark Item as Missing"
      open={showMissingModal}
      onOk={confirmMissing}
      onCancel={() => setShowMissingModal(false)}
      okText="Confirm Missing"
      okButtonProps={{ danger: true }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>Mark <Text strong>{item.title}</Text> as missing?</Text>
        <TextArea
          placeholder="Optional: Reason for missing item..."
          value={missingNotes}
          onChange={(e) => setMissingNotes(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>

    {/* Quantity Mismatch Modal */}
    <Modal
      title="Quantity Mismatch"
      open={showMismatchModal}
      onOk={confirmMismatch}
      onCancel={() => setShowMismatchModal(false)}
      okText="Confirm Quantity"
      okButtonProps={{ disabled: mismatchQty === verificationStatus.qty_expected }}
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
  </>);
};

export default ItemVerificationRow;