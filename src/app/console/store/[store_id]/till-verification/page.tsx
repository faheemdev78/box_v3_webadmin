'use client'
/**
 * Till Orders Queue Component
 * Displays list of orders ready for till verification (PICKING_COMPLETE stage)
 * Updated for shift-based system
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Table, Tag, Space, Typography, Empty, message, Modal, Input, Alert, Row, Col } from 'antd';
import { LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTillVerificationQueue, useMyActiveTillShift, 
  // useMyLockedOrders,
  useOpenTillShift, useCloseTillShift, useStartOrderVerification
} from '@/hooks/useTillVerification';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import { getActiveShift, getTillVerification } from '@/rStore/slices/tillVerificationSlice';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { Loader, OrderTable, Button, usePageProps, DevBlock, Icon, BarcodeScanner } from '@/components';
import { adminRoot, defaultPageSize, defaultPagination } from '@/configs';
import Link from 'next/link';
import { Page } from '@/template';
import { useLazyQuery } from '@apollo/client/react';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { __yellow } from '@/lib/consoleHelper';

import LIST_DATA from '@/graphql/order/ordersOnTillQuery.graphql'

const { Title, Text } = Typography;

dayjs.extend(duration)
dayjs.extend(relativeTime);

function ActiveSession({ store, onSessionUpdate }:{
  onSessionUpdate: ()=>void;
  store: any;
}){
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');

  const { session: shiftSession, loading: shiftLoading, refetch: refetchShift } = useMyActiveTillShift();
  const shiftSessionAny = shiftSession as any;
  const activeShift = shiftSessionAny;
  const { openShift, loading: openingShift } = useOpenTillShift();
  const { closeShift, loading: closingShift } = useCloseTillShift();

  const shiftDuration = activeShift ? dayjs.duration(dayjs().diff(dayjs(activeShift.session_started_at))) : null;

  const handleOpenShift = async () => {
    // console.log(__yellow("handleOpenShift()"))
    await openShift(store._id);
    message.success('Shift started successfully');
    if (refetchShift) await refetchShift();  // Refetch shift to update UI
    onSessionUpdate();
  };

  const handleCloseShift = async () => {
    // console.log(__yellow("handleCloseShift()"))
    await closeShift(closeNotes);
    message.success('Shift closed successfully');
    setShowCloseShiftModal(false);
    setCloseNotes('');
    if (refetchShift) await refetchShift();
    onSessionUpdate();
  };

  if (shiftLoading) return <Loader loading={true} />


  return (<>
    {!activeShift ? <>
      <Card style={{ marginBottom: 16, backgroundColor: '#f0f0f0', borderColor: '#d9d9d9' }} size="small">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary">No active shift. Start a shift to begin till verification.</Text>
          <Button type="primary" icon={<LoginOutlined />} onClick={handleOpenShift} loading={openingShift}>Open Shift</Button>
        </Space>
      </Card>
    </> : <>
      <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff', borderColor: '#1890ff' }} size="small">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Tag color="blue">SHIFT ACTIVE</Tag>
              <Text strong>Shift Duration: {shiftDuration?.format('HH:mm:ss')}</Text>
              <Text type="secondary">•</Text>
              <Text>Units Processed: {activeShift?.performance?.total_units_processed}</Text>
              <Text type="secondary">•</Text>
              <Text>Success Rate: {activeShift?.performance?.total_units_processed > 0
                ? ((activeShift.performance.successful_units / activeShift.performance.total_units_processed) * 100).toFixed(1)
                : 0}%</Text>
            </Space>
            <Button danger icon={<LogoutOutlined />} onClick={() => setShowCloseShiftModal(true)} loading={closingShift}>Close Shift</Button>
        </Space>
        
          {activeShift?.till_verification_orders?.length > 0 && <>
            <Text strong>Orders on Hold: </Text>
            <Space>{activeShift.till_verification_orders.map((order:any, i:number) => {
              return <Link href={`${adminRoot}/store/${activeShift._id_store}/till-verification/${order.order_serial}/verify`} key={i}><Tag color="yellow">{order.order_serial}</Tag></Link>
            })}</Space>
          </>}
        
      </Card>
    </>}

    <Modal
      title="Close Shift"
      open={showCloseShiftModal}
      onOk={handleCloseShift}
      onCancel={() => setShowCloseShiftModal(false)}
      okText="Close Shift"
      okButtonProps={{ danger: true }}
      confirmLoading={closingShift}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Text>Are you sure you want to close your shift?</Text>
        {shiftSessionAny?.till_verification_orders?.length > 0 && <Alert title={`${shiftSessionAny.till_verification_orders.length} orders in process.`} description={`You have ${shiftSessionAny.till_verification_orders.length} order(s) in progress. They will be released.`} type="warning" showIcon />}
        {/* {shiftSessionAny?.till_verification_orders?.length > 0 && (<Text type="warning">⚠️ You have {activeShift?.performance?.total_units_processed || 0} order(s) in progress. They will be released.</Text>)} */}
        <Input.TextArea placeholder="Optional: Shift notes..." value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} rows={3} />
      </Space>
    </Modal>

  </>)
}


function TillOrders(){
  const { store }:any = usePageProps()
  const router = useRouter();
  // const settings = useAppSelector(getSettings);
  const tillVerification = useAppSelector(getTillVerification);
  const storeRef = useRef(store);

  const [state, setState] = useState<any>({
      pagination: defaultPagination,
      dataSource: null,
      filter: { },
      others: { },
  })
  const stateRef = useRef<any>(state);
  const refreshInFlightRef = useRef(false);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);

  const [ordersOnTillQuery, { called, loading, ...orderQueryData }] = useLazyQuery<any>(LIST_DATA, { 
        fetchPolicy: 'no-cache',
        notifyOnNetworkStatusChange: true,
      }
  );
  const orderQueryDataRef = useRef(orderQueryData);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  useEffect(() => {
    orderQueryDataRef.current = orderQueryData;
  }, [orderQueryData]);

  const fetchData = useCallback(async (
    { filter, pagination = {} }: { filter?: any; pagination?: { pageSize?: number; current?: number } },
    { background = false }: { background?: boolean } = {}
  ) => {
    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    if (background) setBackgroundRefreshing(true);

    const currentState = stateRef.current;
    const currentStore = storeRef.current;
    const variables = {
        limit: pagination?.pageSize || currentState.pagination.pageSize,
        page: pagination?.current || currentState.pagination.current,
        filter: filter ?? currentState.filter ?? {},
        others: currentState.others || {},
        _id_store: currentStore._id,
    }

    try {
      const resutls = await ordersOnTillQuery({
          variables: {
              ...variables,
              filter: JSON.stringify({ ...variables.filter, 'store._id': currentStore._id }),
              others: JSON.stringify(variables.others || {}),
          }
        })
          .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.ordersOnTillQuery }))
          .catch(catchApolloError)

      if (resutls && resutls.error) {
          message.error(resutls.error.message);
          return;
      }
      if (!resutls) return;

      setState((currentState: any) => {
        const nextState = {
          ...currentState,
          pagination: {
              ...currentState.pagination,
              current: resutls.pagination.page,
              total: resutls.pagination.totalDocs,
              pageSize: resutls.pagination.limit,
          },
          filter: variables.filter,
          dataSource: resutls?.edges,
        };

        stateRef.current = nextState;
        return nextState;
      })
    } finally {
      refreshInFlightRef.current = false;
      if (background) setBackgroundRefreshing(false);
    }
  }, [ordersOnTillQuery]);

  const handleScan = useCallback((barcode: string) => {
    const orderSerial = String(barcode || '').trim();
    const orders = stateRef.current.dataSource || [];
    const currentStore = storeRef.current;

    console.log("********** Till List Scanned *******", orderSerial);
    console.log("state.dataSource: ", orders);
    console.log("orderQueryData: ", orderQueryDataRef.current);

    if (!orderSerial) return;

    const order = orders.find((o: any) => String(o?.serial || '').trim() === orderSerial);
    if (!order) {
      message.error(`Order ${orderSerial} is not in the current till list`);
      return;
    }

    router.push(`${adminRoot}/store/${order?.store?._id || currentStore._id}/till-verification/${order.serial}/verify`);
  }, [router])

  
  useEffect(() => {
    if (called || loading) return;
    fetchData({})
  }, [called, loading, fetchData])

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void fetchData({}, { background: true });
    }, 60 * 1000);

    return () => window.clearInterval(refreshTimer);
  }, [fetchData]);

  return (<>
    <BarcodeScanner onScan={handleScan} debugLabel="TillOrdersScanner" />

    {/* Shift Status Banner */}
    <ActiveSession store={store} onSessionUpdate={() => fetchData({})} />

    <Page>

      <Card
        title={<Space>
          <Title level={3} style={{ margin: 0 }}>Orders On-Till</Title>
          {state.dataSource !== null && <Tag color="green">{state?.pagination?.total || 0} orders found</Tag>}
        </Space>}
        extra={<Button onClick={() => fetchData({})} loading={loading || backgroundRefreshing}>Refresh</Button>}
        styles={{ body: { padding: 0 } }}
      >
        <OrderTable
          busy={false}
          columns={['serial', 'customer', 'baskets', 'picker', 'order', 'delivery_slot', 'status', 'createdAt', {
            key: 'actions',
            options: { reset: false, till_verification: true }
          }]}
          dataSource={state.dataSource}
          pagination={state.pagination}
          // actions={{ reset: true, till_verification: true }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </Page>

    <DevBlock obj={tillVerification} title="tillVerification" />

  </>)
}

export default TillOrders;
