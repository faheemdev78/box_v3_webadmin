'use client'
/**
 * Till Orders Queue Component
 * Displays list of orders ready for till verification (PICKING_COMPLETE stage)
 */

import React, { useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Typography, Empty, Spin, message, Modal } from 'antd';
import { PlayCircleOutlined, UserOutlined, ShoppingOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTillVerificationQueue, useActiveTillSession } from '@_/hooks/useTillVerification';
import { useAppSelector, useAppDispatch } from '@_/rStore/hooks';
import { getSettings } from '@_/rStore/slices/systemSlice';
import { getActiveSession, isSessionActive, endSession, startSession } from '@_/rStore/slices/tillVerificationSlice';
import { useLazyQuery } from '@apollo/client';
import GET_ACTIVE_SESSION from '@_/graphql/till_verification/getActiveTillSession.graphql';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Loader } from '@_/components';
import { adminRoot } from '@_/configs';
import Link from 'next/link';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface TillOrdersQueueProps {
  limit?: number;
  page?: number;
  _id_store: string;
}

export const TillOrdersQueue: React.FC<TillOrdersQueueProps> = ({ limit = 50, page = 1, _id_store }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(getSettings);
  const hasActiveSession = useAppSelector(isSessionActive);
  const activeSession = useAppSelector(getActiveSession);

  // Lazy query to fetch active session from backend (only runs once)
  const [fetchActiveSession, { data: activeSessionData, called }] = useLazyQuery(GET_ACTIVE_SESSION);

  // Fetch active session on mount (only if not already called)
  useEffect(() => {
    if (!called) {
      fetchActiveSession();
    }
  }, [called, fetchActiveSession]);

  // Sync backend session to Redux when data arrives
  useEffect(() => {
    if (activeSessionData?.getActiveTillSession?.session && !hasActiveSession) {
      const session = activeSessionData.getActiveTillSession.session;
      console.log('Restoring backend session to Redux:', session);
      dispatch(
        startSession({
          _id_session: session._id,
          _id_order: session._id_order,
          order_data: session.order_data,
        })
      );
    }
  }, [activeSessionData, hasActiveSession, dispatch]);

  // console.log('TillOrdersQueue - hasActiveSession:', hasActiveSession);
  // console.log('TillOrdersQueue - activeSession:', activeSession);

  const { orders, total, loading, error, refetch } = useTillVerificationQueue(_id_store, limit, page);

  // const handleStartVerification = (orderId: string) => router.push(`${adminRoot}/store/${_id_store}/till-verification/${orderId}/verify`);

  const columns = [
    { title: 'Order #', dataIndex: 'serial', key: 'serial', width: 200,
      render: (serial: string) => (
        <Text strong style={{ fontSize: 16 }}>{serial}</Text>
      ),
    },
    { title: 'Customer', dataIndex: 'customer', key: 'customer',
      render: (customer: any) => (<Space>
        <UserOutlined />
        <Text>{customer?.name || 'N/A'}</Text>
      </Space>),
    },
    { title: 'Picker', width: 180, key: 'picker', dataIndex: ['processing_stages', 'picking', 'handled_by'],
      render: (handledBy: any) => (<Space>
        <UserOutlined style={{ color: '#52c41a' }} />
        <Text>{handledBy?.name || 'N/A'}</Text>
      </Space>),
    },
    { title: 'Items', dataIndex: ['current_order', 'items'], key: 'items', width: 150, align: 'center' as const,
      render: (items: any[]) => (<Space>
        <ShoppingOutlined />
        <span>{items?.length || 0} items</span>
      </Space>
      ),
    },
    { title: 'Total', dataIndex: ['current_order', 'totals', 'grandTotal'], key: 'total', width: 150, align: 'right' as const,
      render: (grandTotal: number) => (
        <Text strong style={{ fontSize: 16 }}>
          {settings.currency}{grandTotal?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
    { title: 'Picked At', dataIndex: ['processing_stages', 'picking', 'completed_at'], key: 'picked_at', width: 160,
      render: (completedAt: string) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> {dayjs(completedAt).format('HH:mm A')}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(completedAt).fromNow()}
          </Text>
        </Space>
      ),
    },
    { title: 'Status', key: 'lock_status', width: 120,
      render: (_: any, record: any) => {
        if (record.is_locked_by_me) return <Tag color="orange">Locked by you</Tag>;
        if (record.locked_by) return <Tag color="red">Locked</Tag>;
        return <Tag color="green">Available</Tag>;
      },
    },
    { title: 'Action', key: 'action', width: 100, fixed: 'right' as const,
      render: (_: any, record: any) => (<>
        {/* <Link href={``}><PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}</Link> */}

        {!(record.locked_by && !record.is_locked_by_me) ? '' :
          <Link href={`${adminRoot}/store/${_id_store}/till-verification/${record._id}/verify`}><Space size={2}>
            <PlayCircleOutlined />
            {record.is_locked_by_me ? 'Resume' : 'Start'}
          </Space></Link>
        }

        {/* {!(record.locked_by && !record.is_locked_by_me) && 
          <Link className='button' href={`${adminRoot}/store/${_id_store}/till-verification/${record._id}/verify`}>
            <PlayCircleOutlined />
            {record.is_locked_by_me ? 'Resume' : 'Start'}
          </Link>
        } */}

        <Button type="primary" size="small" 
          // icon={<PlayCircleOutlined />} 
          disabled={record.locked_by && !record.is_locked_by_me}
          >
          <Link href={`${adminRoot}/store/${_id_store}/till-verification/${record._id}/verify`}>
            <PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}
          </Link>
        </Button>
      </>),
    },
  ];

  if (error) {
    return (
      <Card>
        <Empty
          description={
            <Space direction="vertical">
              <Text type="danger">Error loading orders</Text>
              <Text type="secondary">{error.message || 'Unknown error'}</Text>
              <Button onClick={() => refetch()}>Retry</Button>
            </Space>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Active Session Banner */}
      {hasActiveSession && activeSession.order_data && (
        <Card
          style={{ marginBottom: 16, backgroundColor: '#fff7e6', borderColor: '#faad14' }}
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Tag color="orange">ACTIVE SESSION</Tag>
                <Text strong>Order #{activeSession.order_data.serial}</Text>
                <Text type="secondary">•</Text>
                <Text>{activeSession.order_data.customer?.name}</Text>
              </Space>
              <Link href={`${adminRoot}/store/${_id_store}/till-verification/${activeSession._id_order}/verify`}><PlayCircleOutlined /> Continue Verification</Link>
              {/* <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => router.push(`${adminRoot}/store/${_id_store}/till-verification/${activeSession._id_order}/verify`)}>Continue Verification</Button> */}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              You have an active till verification session. Please complete or hold it before starting a new one.
            </Text>
          </Space>
        </Card>
      )}

      <Card
        title={
          <Space>
            <Title level={3} style={{ margin: 0 }}>Till Verification Queue</Title>
            <Tag color="blue">{total} orders</Tag>
          </Space>
        }
        extra={
          <Button onClick={() => refetch()} loading={loading}>Refresh</Button>
        }
      >
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader loading={true} size={'large'}>Loading orders...</Loader>
          </div>
        ) : orders.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text>No orders ready for till verification</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Orders will appear here when picking is completed</Text>
              </Space>
            }
          />
        ) : (
          <Table
            dataSource={orders}
            columns={columns}
            rowKey="_id"
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} orders`,
            }}
            loading={loading}
            scroll={{ x: 1200 }}
            rowClassName={(record) => {
              if (record.is_locked_by_me) return 'row-locked-by-me';
              if (record.locked_by) return 'row-locked';
              return '';
            }}
          />
        )}
      </Card>

      <style jsx global>{`
        .row-locked-by-me {
          background-color: #fff7e6 !important;
        }
        .row-locked {
          background-color: #fff1f0 !important;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default TillOrdersQueue;