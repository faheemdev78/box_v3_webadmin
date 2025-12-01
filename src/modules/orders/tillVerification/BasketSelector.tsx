'use client'
/**
 * Basket Selector Component
 * Allows till operators to select delivery baskets for verified orders
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Space, Typography, Tag, Empty, Alert } from 'antd';
import { CheckCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { Loader } from '@_/components';

import GET_AVAILABLE_BASKETS from '@_/graphql/baskets/getAvailableBaskets.graphql';



const { Title, Text } = Typography;

interface Basket {
  _id: string;
  title: string;
  barcode: string;
  color: string;
  status: string;
}

interface BasketSelectorProps {
  storeId: string;
  onSelectionChange: (selectedIds: string[]) => void;
  minRequired?: number;
  category: 'pickup' | 'dispatch';
}

export const BasketSelector: React.FC<BasketSelectorProps> = ({
  storeId,
  onSelectionChange,
  minRequired = 1,
  category
}) => {
  const [selectedBaskets, setSelectedBaskets] = useState<string[]>([]);

  // Query available delivery baskets
  const { data, loading, error, refetch } = useQuery(GET_AVAILABLE_BASKETS, {
    variables: { _id_store: storeId, category, limit: 50 },
    skip: !storeId,
  });

  const baskets: Basket[] = data?.getAvailableBaskets?.baskets || [];

  // Notify parent when selection changes
  useEffect(() => {
    onSelectionChange(selectedBaskets);
  }, [selectedBaskets, onSelectionChange]);

  const toggleBasket = (basketId: string) => {
    if (selectedBaskets.includes(basketId)) {
      setSelectedBaskets(selectedBaskets.filter(id => id !== basketId));
    } else {
      setSelectedBaskets([...selectedBaskets, basketId]);
    }
  };

  const isSelected = (basketId: string) => selectedBaskets.includes(basketId);

  if (loading) {
    return <Loader loading={true}>Loading available baskets...</Loader>;
  }

  if (error || data?.getAvailableBaskets?.error) {
    return (
      <Alert
        message="Error Loading Baskets"
        description={error?.message || data?.getAvailableBaskets?.error?.message || 'Failed to load baskets'}
        type="error"
        showIcon
      />
    );
  }

  if (!baskets || baskets.length === 0) {
    return (
      <Empty
        image={<ShoppingOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        description={
          <Space direction="vertical">
            <Text>No delivery baskets available</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              All baskets may be in use. Please wait or release locked baskets.
            </Text>
          </Space>
        }
      />
    );
  }

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={5} style={{ marginBottom: 4 }}>Select Delivery Baskets</Title>
          <Text type="secondary">Choose at least {minRequired} basket(s) for delivery</Text>
        </div>

        {/* Selection count */}
        <Alert
          message={
            <Space>
              <Text strong>{selectedBaskets.length}</Text>
              <Text>basket(s) selected</Text>
              {selectedBaskets.length < minRequired && (
                <Tag color="warning">{minRequired - selectedBaskets.length} more required</Tag>
              )}
              {selectedBaskets.length >= minRequired && (
                <Tag color="success" icon={<CheckCircleOutlined />}>Ready</Tag>
              )}
            </Space>
          }
          type={selectedBaskets.length >= minRequired ? 'success' : 'info'}
        />

        {/* Baskets grid */}
        <Row gutter={[12, 12]}>
          {baskets.map((basket) => {
            const selected = isSelected(basket._id);
            return (
              <Col xs={12} sm={8} md={6} lg={6} key={basket._id}>
                <Card
                  hoverable
                  onClick={() => toggleBasket(basket._id)}
                  style={{
                    borderWidth: 2,
                    borderColor: selected ? basket.color || '#1890ff' : '#d9d9d9',
                    backgroundColor: selected ? `${basket.color}10` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  styles={{
                    body:{
                      padding: 12
                    }
                  }}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {/* Color indicator */}
                    <div style={{ width: '100%', height: 8, backgroundColor: basket.color || '#d9d9d9', borderRadius: 4, }} />

                    {/* Basket info */}
                    <Title level={5} style={{ margin: 0, fontSize: 14 }}>{basket.title}</Title>
                    <Text type="secondary" style={{ fontSize: 11 }}>{basket.barcode}</Text>

                    {/* Selected indicator */}
                    {selected && (<Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, fontSize: 10 }}>Selected</Tag>)}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Selected baskets summary */}
        {selectedBaskets.length > 0 && (
          <Card size="small" title="Selected Baskets">
            <Space wrap>
              {selectedBaskets.map((id) => {
                const basket = baskets.find((b) => b._id === id);
                if (!basket) return null;
                return (<Tag key={id} closable onClose={() => toggleBasket(id)} _color={basket.color} style={{ margin: 4, fontSize: 13, padding: '4px 8px' }}>
                  {basket.title} ({basket.barcode})
                </Tag>);
              })}
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
};
