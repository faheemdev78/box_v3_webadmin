'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Alert, Card, Col, message, Popconfirm, Row, Space, Table, Tag, Typography, Modal, InputNumber, Statistic, Divider
} from 'antd';
import { DollarOutlined, ShoppingOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { PageHeader } from '@/template';
import { Button, usePageProps } from '@/components';
import { Page } from '@/template/page';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';

import GET_DRIVERS_WITH_PENDING_SETTLEMENT from '@/graphql/drivers/getDriversWithPendingSettlement.graphql'
import SETTLE_DRIVER_WALLET from '@/graphql/drivers/settleDriverWallet.graphql'
import RELEASE_DRIVER_ORDERS from '@/graphql/drivers/releaseDriverOrders.graphql'

const { Title, Text } = Typography;

interface DriverSettlement {
  driver: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  session: {
    _id: string;
    session_started_at: string;
    driver_wallet: {
      total_cod_collected: number;
      deposited_amount: number;
      pending_deposit: number;
      is_settled: boolean;
    };
    baskets_assigned: string[];
    baskets_returned: string[];
    all_baskets_returned: boolean;
  };
  total_cod_collected: number;
  deposited_amount: number;
  pending_deposit: number;
  delivered_orders_count: number;
  pending_orders: Array<{
    _id: string;
    serial: string;
    current_stage: string;
  }>;
}

function DriverSettlements() {
  const settings = useAppSelector(getSettings);

  const { store } = usePageProps() as unknown as { store: any }

  const [drivers, setDrivers] = useState<DriverSettlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverSettlement | null>(null);
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);

  const [getDrivers] = useLazyQuery<any>(GET_DRIVERS_WITH_PENDING_SETTLEMENT, {
    fetchPolicy: 'network-only'
  });
  const [settleWallet] = useMutation<any>(SETTLE_DRIVER_WALLET);
  const [releaseOrders] = useMutation<any>(RELEASE_DRIVER_ORDERS);

  const fetchDrivers = async () => {
    setLoading(true);
    const result = await getDrivers({
      variables: { _id_store: store._id }
    })
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.getDriversWithPendingSettlement }))
      .catch(catchApolloError);

    if (result && !result.error) {
      setDrivers(result || []);
    } else if (result?.error) {
      message.error(result.error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSettleWallet = async (driver: DriverSettlement) => {
    setSelectedDriver(driver);
    setDepositAmount(driver.pending_deposit || 0);
    setSettlementModalVisible(true);
  };

  const confirmSettlement = async () => {
    if (!selectedDriver) return;

    const result = await settleWallet({
      variables: {
        _id_session: selectedDriver.session._id,
        _id_driver: selectedDriver.driver._id,
        amount_deposited: depositAmount
      }
    })
      .then(r => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr:any) => rr?.data?.settleDriverWallet
      }))
      .catch(catchApolloError);

    if (result && result.success) {
      message.success('Driver wallet settled successfully!');
      setSettlementModalVisible(false);
      setSelectedDriver(null);
      fetchDrivers();
    } else if (result?.error) {
      message.error(result.error.message);
    }
  };

  const handleReleaseOrders = async (driver: DriverSettlement) => {
    const result = await releaseOrders({
      variables: {
        _id_driver: driver.driver._id,
        _id_session: driver.session._id
      }
    })
      .then(r => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr:any) => rr?.data?.releaseDriverOrders
      }))
      .catch(catchApolloError);

    if (result && result.success) {
      message.success('Driver orders released successfully!');
      fetchDrivers();
    } else if (result?.error) {
      message.error(result.error.message);
    }
  };

  const canReleaseOrders = (driver: DriverSettlement) => {
    const basketsReturned = driver.session.all_baskets_returned;
    const walletSettled = driver.session.driver_wallet?.is_settled ?? true;
    return basketsReturned && walletSettled;
  };

  const columns = [
    {
      title: 'Driver',
      key: 'driver',
      render: (record: DriverSettlement) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.driver.name}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.driver.phone}</div>
        </div>
      ),
    },
    {
      title: 'Delivered Orders',
      dataIndex: 'delivered_orders_count',
      key: 'delivered_orders_count',
      align: 'center' as const,
      render: (count: number) => (
        <Tag color="blue" icon={<ShoppingOutlined />}>
          {count} orders
        </Tag>
      ),
    },
    {
      title: 'Baskets',
      key: 'baskets',
      align: 'center' as const,
      render: (record: DriverSettlement) => {
        const assigned = record.session.baskets_assigned?.length || 0;
        const returned = record.session.baskets_returned?.length || 0;
        const allReturned = record.session.all_baskets_returned;

        return (
          <Space orientation="vertical" size="small">
            <div>
              <Text>{returned}/{assigned} returned</Text>
            </div>
            {allReturned ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                All Returned
              </Tag>
            ) : (
              <Tag color="warning" icon={<ClockCircleOutlined />}>
                Pending
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'COD Collected',
      key: 'cod',
      align: 'right' as const,
      render: (record: DriverSettlement) => {
        const wallet = record.session.driver_wallet;
        if (!wallet || wallet.total_cod_collected === 0) {
          return <Text type="secondary">No COD</Text>;
        }

        return (
          <Space orientation="vertical" size="small" style={{ textAlign: 'right', width: '100%' }}>
            <div>
              <Text strong>{wallet.total_cod_collected.toFixed(2)}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Deposited: {wallet.deposited_amount.toFixed(2)}
              </Text>
            </div>
            {wallet.pending_deposit > 0 && (
              <Tag color="error" icon={<WarningOutlined />}>Pending: {wallet.pending_deposit.toFixed(2)}</Tag>
            )}
            {wallet.is_settled && (
              <Tag color="success" icon={<CheckCircleOutlined />}>Settled</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      render: (record: DriverSettlement) => {
        const wallet = record.session.driver_wallet;
        const hasPendingCOD = wallet && wallet.pending_deposit > 0;
        const basketsPending = !record.session.all_baskets_returned;
        const canRelease = canReleaseOrders(record);

        return (
          <Space orientation="vertical" size="small">
            {hasPendingCOD && !wallet.is_settled && (
              <Button type="primary" size="small" icon={<DollarOutlined />} onClick={() => handleSettleWallet(record)}>Settle Wallet</Button>
            )}

            {basketsPending && (
              <Tag color="orange" icon={<ClockCircleOutlined />}>Waiting for baskets</Tag>
            )}

            {canRelease && record.pending_orders.length > 0 && (
              <Popconfirm
                title="Release Orders"
                description={`Release ${record.pending_orders.length} order(s) from this driver?`}
                onConfirm={() => handleReleaseOrders(record)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="default" size="small" icon={<CheckCircleOutlined />}>
                  Release Orders ({record.pending_orders.length})
                </Button>
              </Popconfirm>
            )}

            {canRelease && record.pending_orders.length === 0 && (
              <Tag color="success" icon={<CheckCircleOutlined />}>All Clear</Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (<>
    <PageHeader title="Driver Settlements">
      <Button onClick={fetchDrivers} loading={loading}>Refresh</Button>
    </PageHeader>

      <Page>
        {drivers.length === 0 && !loading ? (
          <Card>
            <Alert
              title="No Pending Settlements"
              description="There are no drivers with pending settlements at the moment."
              type="info"
              showIcon
            />
          </Card>
        ) : (
          <Card>
            <Table
              dataSource={drivers}
              columns={columns}
              rowKey={(record) => record.driver._id}
              loading={loading}
              pagination={false}
            />
          </Card>
        )}

        {/* Settlement Modal */}
        <Modal
          title="Settle Driver Wallet"
          open={settlementModalVisible}
          onOk={confirmSettlement}
          onCancel={() => {
            setSettlementModalVisible(false);
            setSelectedDriver(null);
          }}
          okText="Confirm Settlement"
          cancelText="Cancel"
        >
          {selectedDriver && (
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={5}>Driver Information</Title>
                <Text>{selectedDriver.driver.name}</Text>
                <br />
                <Text type="secondary">{selectedDriver.driver.phone}</Text>
              </div>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total COD Collected"
                    value={selectedDriver.session.driver_wallet?.total_cod_collected || 0}
                    prefix=""
                    precision={2}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Already Deposited"
                    value={selectedDriver.session.driver_wallet?.deposited_amount || 0}
                    prefix=""
                    precision={2}
                  />
                </Col>
              </Row>

              <Divider />

              <div>
                <Title level={5}>Amount Being Deposited</Title>
                <InputNumber
                  style={{ width: '100%' }}
                  value={depositAmount}
                  onChange={(value) => setDepositAmount(value || 0)}
                  prefix={settings.currency}
                  precision={2}
                  min={0}
                  max={selectedDriver.pending_deposit}
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                  Pending deposit: {selectedDriver.pending_deposit.toFixed(2)}
                </Text>
              </div>
            </Space>
          )}
        </Modal>
      </Page>
    </>
  )
}

export default DriverSettlements;
