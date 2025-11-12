'use client'
/**
 * Till Orders Queue Component
 * Displays list of orders ready for till verification (PICKING_COMPLETE stage)
 */

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Typography, Empty, Spin, message, Modal, Alert } from 'antd';
import { PlayCircleOutlined, UserOutlined, ShoppingOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@_/rStore/hooks';
import { getSettings } from '@_/rStore/slices/systemSlice';
import { useLazyQuery } from '@apollo/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { DevBlock, Icon, Loader, OrderTable, usePageProps } from '@_/components';
import { adminRoot, defaultPageSize, defaultPagination } from '@_/configs';
import Link from 'next/link';
import { checkApolloRequestErrors, catchApolloError } from '@_/lib/utill_apollo';
import { Page } from '@_/template';

import GET_ORDER_QUEUE from '@_/graphql/order/getReadyToDispatchQueue.graphql';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface OrdersListProps {
  limit?: number;
  page?: number;
  _id_store: string;
}

export const OrdersList: React.FC<OrdersListProps> = ({ limit = 50, page = 1, _id_store }) => {
  const settings = useAppSelector(getSettings);
  const { store } = usePageProps()

  const [state, setState] = useState({
      pagination: defaultPagination,
      pageView: "list",
      dataSource: null,
      filter: { },
  })

  // const [getReadyToDispatchQueue, { called, ...queue_restuls }] = useLazyQuery(GET_ORDER_QUEUE);
  const [getReadyToDispatchQueue, { called, loading }] = useLazyQuery(GET_ORDER_QUEUE, { fetchPolicy: 'network-only' });

  const fetchData = async ({ filter, pagination = {} }) => {
    const variables = {
      limit: pagination?.pageSize || state.pagination.pageSize,
      page: pagination?.current || state.pagination.current,
      filter: filter || state.filter || {},
      others: state.others || {},
    }

    const resutls = await getReadyToDispatchQueue({
      variables: {
        ...variables,
        filter: JSON.stringify({ ...variables.filter, 'store._id': store._id }),
        others: JSON.stringify(variables.others || {})
      }
    })
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.getReadyToDispatchQueue }))
      .catch(catchApolloError)
    // setBusy(false)

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
        // resutls.pagination.totalPages,
        pageSize: resutls.pagination.limit,
      },
      filter: variables.filter,
      dataSource: resutls?.edges,
      // dataSource: resutls?.edges?.map(o => ({
      //     ...o,
      //     children: o?.variations?.length > 0 && o.variations,
      //     variations: undefined
      // })),
    })

  }







  const [error, setError] = useState(false);
  const [listData, set_listData] = useState({
    dataSource: null,
    pagination: {
      current: page,
      pageSize: limit,
      total: 0,
      showSizeChanger: true,
      showTotal: (total) => `Total ${total} orders`,
    }
  })


  // Fetch active session on mount (only if not already called)
  useEffect(() => {
    if (called) return
    fetchOrdersList({});
  }, [called]);


  const fetchOrdersList = async ({ page=1, limit=defaultPageSize }) => {
    let resutls = await getReadyToDispatchQueue({ variables: {
      limit,
      page, 
      _id_store
    } })
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.getReadyToDispatchQueue }))
      .catch(catchApolloError)

    if (resutls && resutls.error) setError(resutls.error.message)

    set_listData({
      dataSource: resutls.edges,
      pagination: {
        ...resutls.pagination,
        current: page, // resutls.pagination.page,
        pageSize: limit, // resutls.pagination.limit,
        total: resutls.pagination.totalDocs,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} orders`,
      }
    })

  }


  const columns = [
    { title: 'Order #', dataIndex: 'serial', key: 'serial', width: 200, render: (serial: string) => (<Text strong style={{ fontSize: 16 }}>{serial}</Text>) },
    { title: 'Customer', dataIndex: 'customer', key: 'customer',
      render: (customer: any, rec:any) => {
        return (<>
          <Space><UserOutlined /><Text>{customer?.name || 'N/A'}</Text></Space>
          <div><Icon icon="map-location" /> {rec.shippingAddress.full_address}</div>
          {rec?.shippingAddress?.delivery_instructions && <div>
            <Icon icon="info-circle" /> <Text type="secondary" style={{ fontSize: 11 }}>{rec?.shippingAddress?.delivery_instructions}</Text>
          </div>}
        </>)
      },
    },
    { title: 'Items', dataIndex: ['current_order', 'totals'], key: 'current_order', width: 150, align: 'center' as const,
      render: (totals: any) => (<Space>
        <ShoppingOutlined />
        <span>{totals?.totalQuantity || 0} items</span>
      </Space>),
    },
    { title: 'Baskets', dataIndex: 'baskets', key: 'baskets', width: 150, align: 'center' as const,
      render: (totals: any, rec: any) => {
        return (<div>
          <Icon icon="basket-shopping" />
          {rec?.baskets?.map((item: any, i: number) => {
            return <span key={i}>{item.title}</span>
          })}
        </div>)
      },
    },
    { title: 'Zone', dataIndex: ['zone', 'title'], key: 'zone-title', width: 150 },
    { title: 'Total', dataIndex: ['current_order', 'totals', 'grandTotal'], key: 'total', width: 150, align: 'right' as const,
      render: (grandTotal: number) => (
        <Text strong style={{ fontSize: 16 }}>
          {settings.currency}{grandTotal?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
    { title: 'Delivery', dataIndex: ['delivery_slot'], key: 'delivery_slot', width: 160,
      render: (delivery_slot: any) => (<Space direction="vertical" size={0}>
        <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {dayjs(delivery_slot.start_date).format('HH:mm A')}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(delivery_slot.start_date).fromNow()}</Text>
      </Space>),
    },
    { title: 'Status', key: 'lock_status', width: 120,
      render: (_: any, record: any) => {
        if (record.is_locked_by_me) return <Tag color="orange">Locked by you</Tag>;
        if (record.locked_by) return <Tag color="red">Locked</Tag>;
        return <Tag color="green">Available</Tag>;
      },
    },
    // { title: 'Action', key: 'action', width: 100, fixed: 'right' as const,
    //   render: (_: any, record: any) => (<>
    //     <Link href={``}><PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}</Link>

    //     {!(record.locked_by && !record.is_locked_by_me) ? '' :
    //       <Link href={`${adminRoot}/store/${_id_store}/till-verification/${record._id}/verify`}><Space size={2}>
    //         <PlayCircleOutlined />
    //         {record.is_locked_by_me ? 'Resume' : 'Start'}
    //       </Space></Link>
    //     }
    //   </>),
    // },
  ];

  return (<>
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
                options: { reset: true, till_verification: false }
              }]} 
              dataSource={state.dataSource}
              pagination={state.pagination}
              scroll={{ x: 1200 }}
          />
      </Card>
  </Page>


    <div style={{ padding: 24 }}>
      {error && <Alert message={error} type='error' showIcon />}

      <Card
        title={<Space>
            <Title level={3} style={{ margin: 0 }}>Ready To Dispatch Queue</Title>
          <Tag color="blue">{listData.pagination.total} orders</Tag>
        </Space>}
        // extra={<Button onClick={() => refetch()} loading={loading}>Refresh</Button>}
      >
        {/* <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Space direction="vertical">
            <Text>No orders ready for till verification</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Orders will appear here when picking is completed</Text>
          </Space>}
        /> */}

        <Table
          columns={columns}
          rowKey="_id"
          {...listData}
          // dataSource={orders}
          // pagination={{
          //   current: page,
          //   pageSize: limit,
          //   total,
          //   showSizeChanger: true,
          //   showTotal: (total) => `Total ${total} orders`,
          // }}
          loading={queue_restuls.loading}
          // scroll={{ x: 1200 }}
          // rowClassName={(record) => {
          //   if (record.is_locked_by_me) return 'row-locked-by-me';
          //   if (record.locked_by) return 'row-locked';
          //   return '';
          // }}
        />

        <DevBlock obj={listData} title="listData" />

      </Card>
    </div>
  </>);

};

export default OrdersList;