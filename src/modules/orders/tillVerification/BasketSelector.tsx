'use client'
/**
 * Basket Selector Component
 * Allows till operators to select delivery baskets for verified orders
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Typography, Tag, Empty, Alert } from 'antd';
import { CheckCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client/react';
import { Loader } from '@/components';
import { sleep } from '@/lib';

import GET_AVAILABLE_BASKETS from '@/graphql/baskets/getAvailableBaskets.graphql';



const { Text } = Typography;

interface Basket {
  _id: string;
  title: string;
  barcode: string;
  color?: string;
  status?: string;
}

const BasketWrapper = ({ basket, toggleBasket, selected=false, async=false }: 
  { basket: Basket; toggleBasket: Function; selected?: boolean; async?: boolean; }
) => {
  const [busy, setBusy] = useState(false)

  async function onBasketClick(){
    if (busy) return;

    if (async) {
      setBusy(true)
      await toggleBasket(basket)
      setBusy(false)
    }
    else toggleBasket(basket)
  }

  return (<Card
    loading={busy}
    hoverable
    // onClick={() => toggleBasket(basket._id)}
    onClick={() => onBasketClick()}
    style={{
      borderWidth: 2,
      borderColor: selected ? '#009316' : '#d9d9d9',
      backgroundColor: selected ? '#bfffbf' : '#FFFFFF',
      cursor: 'pointer',
      transition: 'all 0.3s',
      maxHeight: '70px',
    }}
    styles={{
      body: {
        padding: 12,
      }
    }}
  >
    <div className='text-center'>
      <div className='font-medium text-lg'>{basket.title}</div>
      <div className='text-xs text-gray-500'>{basket.barcode}</div>
      {/* {selected && (<Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, fontSize: 10 }}>Selected</Tag>)} */}
    </div>
  </Card>)
}

interface BasketSelectorProps {
  storeId: string;
  onSelectionChange: (basket: Basket, action: 'add' | 'remove') => Promise<void> | void;
  minRequired?: number;
  category: 'pickup' | 'dispatch';
  async?: boolean;
  initialSelectedBaskets?: Basket[];
}

export const BasketSelector: React.FC<BasketSelectorProps> = ({
  storeId,
  onSelectionChange,
  minRequired = 1,
  category,
  async = false,
  initialSelectedBaskets = [],
}) => {
  const [selectedBaskets, setSelectedBaskets] = useState<string[]>([]);

  // Query available delivery baskets
  const { data, loading, error } = useQuery<any>(GET_AVAILABLE_BASKETS, {
    variables: { _id_store: storeId, category, limit: 50 },
    skip: !storeId,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const availableBaskets: Basket[] = data?.getAvailableBaskets?.baskets || [];

  useEffect(() => {
    setSelectedBaskets(initialSelectedBaskets.map((basket) => basket._id));
  }, [initialSelectedBaskets]);

  const baskets: Basket[] = [
    ...initialSelectedBaskets,
    ...availableBaskets.filter(
      (basket) => !initialSelectedBaskets.some((selected) => selected._id === basket._id)
    ),
  ];

  // Notify parent when selection changes
  // useEffect(() => {
  //   onSelectionChange(selectedBaskets);
  // }, [selectedBaskets, onSelectionChange]);

  // const toggleBasket = (basketId: string) => {
  //   if (selectedBaskets.includes(basketId)) {
  //     setSelectedBaskets(selectedBaskets.filter(id => id !== basketId));
  //   } else {
  //     setSelectedBaskets([...selectedBaskets, basketId]);
  //   }
  // };

  const onBasketClick = async (basket:Basket) => {
    if (async) await sleep(1500);

    const action = isSelected(basket._id) ? 'remove' : 'add';
    await onSelectionChange(basket, action);

    if (action === 'remove') {
      setSelectedBaskets((current) => current.filter((id) => id !== basket._id));
      return;
    }

    setSelectedBaskets((current) => [...current, basket._id]);
  }

  const isSelected = (basketId: string) => selectedBaskets.includes(basketId);

  if (loading) return <Loader loading={true}>Loading available baskets...</Loader>;

  if (error || data?.getAvailableBaskets?.error) {
    return (
      <Alert
        title="Error Loading Baskets"
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
          <Space orientation="vertical">
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
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {/* Selection count */}
        <Alert
          description={<Space>
            <Text strong>{selectedBaskets.length}</Text>
            <Text>basket(s) selected</Text>
            {selectedBaskets.length < minRequired && (
              <Tag color="warning">{minRequired - selectedBaskets.length} more required</Tag>
            )}
            {selectedBaskets.length >= minRequired && (
              <Tag color="success" icon={<CheckCircleOutlined />}>Ready</Tag>
            )}
          </Space>}
          type={selectedBaskets.length >= minRequired ? 'success' : 'info'}
        />

        {/* Baskets grid */}
        {/* <Grid listData={baskets} onClick={(basket) => toggleBasket(basket._id)} buttonColor='green' buttonText='Add' /> */}

        <Row gutter={[12, 12]}>
          {baskets.map((basket) => {
            const selected = isSelected(basket._id);

            return (
              <Col xs={12} sm={8} md={8} lg={8} key={basket._id}>
                <BasketWrapper 
                  basket={basket}
                  selected={selected}
                  toggleBasket={onBasketClick}
                  async={true}
                  // toggleBasket={(b:any) => toggleBasket(b._id)}
                />
              </Col>
            );
          })}
        </Row>

      </Space>
    </div>
  );
};
