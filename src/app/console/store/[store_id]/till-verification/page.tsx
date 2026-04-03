// /**
//  * Till Verification Queue Page
//  * Route: /console/store/[store_id]/till-verification
//  */

// // 'use client';

// // import React from 'react';
// import { TillOrdersQueue } from '@/modules/orders/tillVerification/TillOrdersQueue';

// export default async function TillVerificationQueuePage({ params }) {
//   const { store_id } = await params;

//   return <TillOrdersQueue _id_store={store_id} />;
// }


'use client'
/**
 * Till Orders Queue Component
 * Displays list of orders ready for till verification (PICKING_COMPLETE stage)
 * Updated for shift-based system
 */

import React, { useEffect, useState } from 'react';
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
import { Loader, OrderTable, Button, usePageProps, DevBlock, Icon } from '@/components';
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
              return <Link href={`${adminRoot}/store/${activeShift._id_store}/till-verification/${order._id_order}/verify`} key={i}><Tag color="yellow">{order.order_serial}</Tag></Link>
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
  const settings = useAppSelector(getSettings);
  const tillVerification = useAppSelector(getTillVerification);
  // console.log("tillVerification: ", tillVerification)

  const [state, setState] = useState({
      pagination: defaultPagination,
      dataSource: null,
      filter: { },
      others: { },
  })
  // const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  // const [closeNotes, setCloseNotes] = useState('');

  const [ordersOnTillQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { 
        fetchPolicy: 'network-only',
        pollInterval: 60 * 1000, // Refresh every 10 seconds
      }
  );

  useEffect(() => {
      if (called || loading) return;
      fetchData({})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [called, loading])  

  // const { orders: lockedOrders, loading: lockedLoading } = useMyLockedOrders();
  
  const fetchData = async ({ filter={}, pagination={} }: { filter?: any; pagination?: { pageSize?: number; current?: number } }) => {
    const variables = {
        limit: pagination?.pageSize || state.pagination.pageSize,
        page: pagination?.current || state.pagination.current,
        filter: filter || state.filter || {},
        others: state.others || {},
        _id_store: store._id,
    }

    const resutls = await ordersOnTillQuery({ 
          variables: {
              ...variables,
              filter: JSON.stringify({ ...variables.filter, 'store._id': store._id }),
              others: JSON.stringify(variables.others || {}),
          }
        })
          .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.ordersOnTillQuery }))
          .catch(catchApolloError)

      if (resutls && resutls.error) {
          message.error(resutls.error.message);
          return;
      }

      setState({
          ...state,
          pagination: { 
              ...state.pagination,
              current: resutls.pagination.page,
              total: resutls.pagination.totalDocs,
              pageSize: resutls.pagination.limit,
          },
          filter: variables.filter,
          dataSource: resutls?.edges,
      })

  }
  

  return (<>
    {/* Shift Status Banner */}
    <ActiveSession store={store} onSessionUpdate={() => fetchData({})} />

    {/* My Locked Orders Section */}
    {/* {lockedOrders.length > 0 && (
      <Card
        title={<Space>
          <LockOutlined /> <Title level={4} style={{ margin: 0 }}>My Orders ({lockedOrders.length})</Title>
        </Space>}
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="small">
          {lockedOrders.map((order: any) => (
            <Card
              key={order._id}
              size="small"
              style={{ backgroundColor: '#fff7e6', borderColor: '#faad14' }}
              hoverable
            >
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Text strong style={{ fontSize: 16 }}>#{order.serial}</Text>
                  <Text type="secondary">•</Text>
                  <Text>{order.customer?.name}</Text>
                  <Text type="secondary">•</Text>
                  <Text>{order.current_order?.items?.length || 0} items</Text>
                </Space>
                <Button type="primary" icon={<PlayCircleOutlined />}
                  onClick={() => router.push(`${adminRoot}/store/${store._id}/till-verification/${order._id}/verify`)}
                >Continue</Button>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    )} */}

    
    <Page>

      <Card
        title={<Space>
          <Title level={3} style={{ margin: 0 }}>Orders On-Till</Title>
          {!loading && <Tag color="green">{state?.pagination?.total || 0} orders found</Tag>}
        </Space>}
        extra={<Button onClick={() => fetchData({})} loading={loading}>Refresh</Button>}
        styles={{ body: { padding: 0 } }}
      >
        <OrderTable
          busy={false}
          columns={['serial', 'customer', 'picker', 'order', 'delivery_slot', 'status', 'createdAt', {
            key: 'actions',
            options: { reset: true, till_verification: true }
          }]}
          dataSource={state.dataSource}
          pagination={state.pagination}
          // actions={{ reset: true, till_verification: true }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </Page>

    <DevBlock obj={tillVerification} title="tillVerification" />
    {/* <DevBlock obj={shiftSession} title="shiftSession" /> */}
    {/* <DevBlock obj={state.dataSource} title="dataSource" /> */}
    {/* <DevBlock obj={lockedOrders} title="lockedOrders" /> */}

  </>)
}

export default TillOrders;

// interface TillOrdersQueueProps {
//   limit?: number;
//   page?: number;
//   _id_store: string;
// }
// const TillOrdersQueue: React.FC<TillOrdersQueueProps> = ({ limit = 50, page = 1, _id_store }) => {
//   const router = useRouter();
//   const settings = useAppSelector(getSettings);

//   // Fetch data
//   const { orders, total, loading, error, refetch } = useTillVerificationQueue(_id_store, limit, page);
//   const { session: shiftSession, loading: shiftLoading, refetch: refetchShift } = useMyActiveTillShift();
//   const { orders: lockedOrders, loading: lockedLoading } = useMyLockedOrders();

//   // Use shiftSession from hook (not Redux) for display
//   const activeShift = shiftSession;

//   // Shift actions
//   const { openShift, loading: openingShift } = useOpenTillShift();
//   const { closeShift, loading: closingShift } = useCloseTillShift();
//   const { startOrder, loading: startingOrder } = useStartOrderVerification();

//   const [showCloseShiftModal, setShowCloseShiftModal] = React.useState(false);
//   const [closeNotes, setCloseNotes] = React.useState('');

//   const handleOpenShift = async () => {
//     try {
//       await openShift(_id_store);
//       message.success('Shift started successfully');
//       await refetchShift();  // Refetch shift to update UI
//       refetch();
//     } catch (error: any) {
//       message.error(error.message || 'Failed to open shift');
//     }
//   };

//   const handleCloseShift = async () => {
//     try {
//       await closeShift(closeNotes);
//       message.success('Shift closed successfully');
//       setShowCloseShiftModal(false);
//       setCloseNotes('');
//       refetch();
//     } catch (error: any) {
//       message.error(error.message || 'Failed to close shift');
//     }
//   };

//   const handleStartOrder = async (orderId: string) => {
//     try {
//       await startOrder(orderId);
//       message.success('Order verification started');
//       router.push(`${adminRoot}/store/${_id_store}/till-verification/${orderId}/verify`);
//     } catch (error: any) {
//       message.error(error.message || 'Failed to start order verification');
//     }
//   };

//   // const handleStartVerification = (orderId: string) => router.push(`${adminRoot}/store/${_id_store}/till-verification/${orderId}/verify`);

//   const columns = [
//     { title: 'Order #', dataIndex: 'serial', key: 'serial', width: 200,
//       render: (serial: string) => (
//         <Text strong style={{ fontSize: 16 }}>{serial}</Text>
//       ),
//     },
//     { title: 'Customer', dataIndex: 'customer', key: 'customer',
//       render: (customer: any) => (<Space>
//         <UserOutlined />
//         <Text>{customer?.name || 'N/A'}</Text>
//       </Space>),
//     },
//     { title: 'Picker', width: 180, key: 'picker', dataIndex: ['processing_stages', 'picking', 'handled_by'],
//       render: (handledBy: any) => (<Space>
//         <UserOutlined style={{ color: '#52c41a' }} />
//         <Text>{handledBy?.name || 'N/A'}</Text>
//       </Space>),
//     },
//     { title: 'Items', dataIndex: ['current_order', 'items'], key: 'items', width: 150, align: 'center' as const,
//       render: (items: any[]) => (<Space>
//         <ShoppingOutlined />
//         <span>{items?.length || 0} items</span>
//       </Space>
//       ),
//     },
//     { title: 'Total', dataIndex: ['current_order', 'totals', 'grandTotal'], key: 'total', width: 150, align: 'right' as const,
//       render: (grandTotal: number) => (
//         <Text strong style={{ fontSize: 16 }}>
//           {settings.currency}{grandTotal?.toFixed(2) || '0.00'}
//         </Text>
//       ),
//     },
//     { title: 'Picked At', dataIndex: ['processing_stages', 'picking', 'completed_at'], key: 'picked_at', width: 160,
//       render: (completedAt: string) => (
//         <Space orientation="vertical" size={0}>
//           <Text type="secondary" style={{ fontSize: 12 }}>
//             <ClockCircleOutlined /> {dayjs(completedAt).format('HH:mm A')}
//           </Text>
//           <Text type="secondary" style={{ fontSize: 11 }}>
//             {dayjs(completedAt).fromNow()}
//           </Text>
//         </Space>
//       ),
//     },
//     { title: 'Status', key: 'lock_status', width: 120,
//       render: (_: any, record: any) => {
//         if (record.is_locked_by_me) return <Tag color="orange">Locked by you</Tag>;
//         if (record.locked_by) return <Tag color="red">Locked</Tag>;
//         return <Tag color="green">Available</Tag>;
//       },
//     },
//     { title: 'Action', key: 'action', width: 100, fixed: 'right' as const,
//       render: (_: any, record: any) => (<>
//         {/* <Link href={``}><PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}</Link> */}

//         {!(record.locked_by && !record.is_locked_by_me) ? '' :
//           <Link href={`${adminRoot}/store/${_id_store}/till-verification/${record._id}/verify`}><Space size={2}>
//             <PlayCircleOutlined />
//             {record.is_locked_by_me ? 'Resume' : 'Start'}
//           </Space></Link>
//         }

//         {/* {!(record.locked_by && !record.is_locked_by_me) && 
//           <Link className='button' href={`${adminRoot}/store/${_id_store}/till-verification/${record._id}/verify`}>
//             <PlayCircleOutlined />
//             {record.is_locked_by_me ? 'Resume' : 'Start'}
//           </Link>
//         } */}

//         <Button type="primary" size="small" 
//           // icon={<PlayCircleOutlined />} 
//           disabled={record.locked_by && !record.is_locked_by_me}
//           >
//           <Link href={`${adminRoot}/store/${_id_store}/till-verification/${record._id}/verify`}>
//             <PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}
//           </Link>
//         </Button>
//       </>),
//     },
//   ];

//   if (error) {
//     return (
//       <Card>
//         <Empty
//           description={
//             <Space orientation="vertical">
//               <Text type="danger">Error loading orders</Text>
//               <Text type="secondary">{error.message || 'Unknown error'}</Text>
//               <Button onClick={() => refetch()}>Retry</Button>
//             </Space>
//           }
//         />
//       </Card>
//     );
//   }

//   // Calculate shift duration
//   const shiftDuration = activeShift
//     ? dayjs.duration(dayjs().diff(dayjs(activeShift.session_started_at)))
//     : null;

//   // Separate orders into sections
//   const myLockedOrderIds = new Set(lockedOrders.map((o: any) => o._id));
//   const availableOrders = orders.filter((o: any) => !o.locked_by);
//   const lockedByOthers = orders.filter((o: any) => o.locked_by && !myLockedOrderIds.has(o._id));


//   return (<Page>
//     {/* Shift Status Banner */}
//     {activeShift ? (
//       <Card
//         style={{ marginBottom: 16, backgroundColor: '#e6f7ff', borderColor: '#1890ff' }}
//         size="small"
//       >
//         <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//           <Space>
//             <Tag color="blue">SHIFT ACTIVE</Tag>
//             <Text strong>Shift Duration: {shiftDuration?.format('HH:mm:ss')}</Text>
//             <Text type="secondary">•</Text>
//             <Text>Units Processed: {activeShift.performance.total_units_processed}</Text>
//             <Text type="secondary">•</Text>
//             <Text>Success Rate: {activeShift.performance.total_units_processed > 0
//               ? ((activeShift.performance.successful_units / activeShift.performance.total_units_processed) * 100).toFixed(1)
//               : 0}%</Text>
//           </Space>
//           <Button danger icon={<LogoutOutlined />} onClick={() => setShowCloseShiftModal(true)} loading={closingShift}>Close Shift</Button>
//         </Space>
//       </Card>
//     ) : (
//       <Card style={{ marginBottom: 16, backgroundColor: '#f0f0f0', borderColor: '#d9d9d9' }}  size="small">
//         <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//           <Text type="secondary">No active shift. Start a shift to begin till verification.</Text>
//           <Button type="primary" icon={<LoginOutlined />} onClick={handleOpenShift} loading={openingShift}>Open Shift</Button>
//         </Space>
//       </Card>
//     )}

//     {/* My Locked Orders Section */}
//     {lockedOrders.length > 0 && (
//       <Card
//         title={
//           <Space>
//             <LockOutlined />
//             <Title level={4} style={{ margin: 0 }}>My Orders ({lockedOrders.length})</Title>
//           </Space>
//         }
//         style={{ marginBottom: 16 }}
//         size="small"
//       >
//         <Space orientation="vertical" style={{ width: '100%' }} size="small">
//           {lockedOrders.map((order: any) => (
//             <Card
//               key={order._id}
//               size="small"
//               style={{ backgroundColor: '#fff7e6', borderColor: '#faad14' }}
//               hoverable
//             >
//               <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//                 <Space>
//                   <Text strong style={{ fontSize: 16 }}>#{order.serial}</Text>
//                   <Text type="secondary">•</Text>
//                   <Text>{order.customer?.name}</Text>
//                   <Text type="secondary">•</Text>
//                   <Text>{order.current_order?.items?.length || 0} items</Text>
//                 </Space>
//                 <Button
//                   type="primary"
//                   icon={<PlayCircleOutlined />}
//                   onClick={() => router.push(`${adminRoot}/store/${_id_store}/till-verification/${order._id}/verify`)}
//                 >
//                   Continue
//                 </Button>
//               </Space>
//             </Card>
//           ))}
//         </Space>
//       </Card>
//     )}

//     {/* Available Orders Section */}
//     <Card
//       title={<Space>
//         <Title level={3} style={{ margin: 0 }}>Orders On-Till</Title>
//         <Tag color="green">{availableOrders.length} available</Tag>
//       </Space>}
//       extra={<Button onClick={() => refetch()} loading={loading}>Refresh</Button>}
//       styles={{ body: { padding: 0 } }}
//     >
//       {loading && orders.length === 0 ? (
//         <div style={{ textAlign: 'center', padding: '60px 0' }}>
//           <Loader loading={true} size={'large'}>Loading orders...</Loader>
//         </div>
//       ) : availableOrders.length === 0 ? (
//         <Empty
//           image={Empty.PRESENTED_IMAGE_SIMPLE}
//           description={
//             <Space orientation="vertical">
//               <Text>No orders available for verification</Text>
//               <Text type="secondary" style={{ fontSize: 12 }}>Available orders will appear here</Text>
//             </Space>
//           }
//         />
//       ) : (<>
//         <OrderTable
//           busy={false} 
//           columns={['serial', 'customer', 'picker', 'order', 'delivery_slot', 'status', 'createdAt', 'actions']} 
//           dataSource={availableOrders}
//           pagination={false}
//           actions={{ reset: true, till_verification: true }}
//           scroll={{ x: 1200 }}
//         />
//         {/* <hr />
//         <Table
//           dataSource={availableOrders}
//           columns={columns}
//           rowKey="_id"
//           pagination={false}
//           scroll={{ x: 1200 }}
//         /> */}
//       </>)}
//     </Card>

//     {/* Locked by Others Section */}
//     {lockedByOthers.length > 0 && (
//       <Card
//         title={<Space>
//           <Title level={4} style={{ margin: 0 }}>Locked by Others</Title>
//           <Tag color="red">{lockedByOthers.length}</Tag>
//         </Space>}
//         style={{ marginTop: 16, opacity: 0.6 }}
//         size="small"
//       >
//         <Table
//           dataSource={lockedByOthers}
//           columns={columns}
//           rowKey="_id"
//           pagination={false}
//           scroll={{ x: 1200 }}
//         />
//       </Card>
//     )}

//     {/* Close Shift Modal */}
//     <Modal
//       title="Close Shift"
//       open={showCloseShiftModal}
//       onOk={handleCloseShift}
//       onCancel={() => setShowCloseShiftModal(false)}
//       okText="Close Shift"
//       okButtonProps={{ danger: true }}
//       confirmLoading={closingShift}
//     >
//       <Space orientation="vertical" style={{ width: '100%' }}>
//         <Text>Are you sure you want to close your shift?</Text>
//         {lockedOrders.length > 0 && (
//           <Text type="warning">
//             ⚠️ You have {lockedOrders.length} order(s) in progress. They will be released.
//           </Text>
//         )}
//         <Input.TextArea
//           placeholder="Optional: Shift notes..."
//           value={closeNotes}
//           onChange={(e) => setCloseNotes(e.target.value)}
//           rows={3}
//         />
//       </Space>
//     </Modal>

//     <style jsx global>{`
//       .row-locked-by-me {
//         background-color: #fff7e6 !important;
//       }
//       .row-locked {
//         background-color: #fff1f0 !important;
//         opacity: 0.6;
//       }
//     `}</style>

//   </Page>);
// };
// export default TillOrdersQueue;
