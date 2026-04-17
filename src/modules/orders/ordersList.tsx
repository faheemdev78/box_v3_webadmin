'use client'

import React, { useState, useEffect } from 'react'
import { Popconfirm, Alert, message, Row, Col, Divider, Radio, Modal, Space, Tag } from 'antd';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { __error } from '@/lib/consoleHelper';
import { Table, Loader, Button, Avatar, DataGrid, Icon, IconButton, DeleteButton, DevBlock } from '@/components';
// import { ProductBarcodeFilter, ProductGridItem, ProductFilter } from './components'
import Link from 'next/link';
import { adminRoot, defaultDateTimeFormat } from '@/configs';
import { useRouter } from 'next/navigation';
import security from '@/lib/security';
import { PageHeader } from '@/template';
import { Page } from '@/template/page';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import _ from 'lodash'

import { OrdersListProps, SearchFilterConfig } from '@/types/order';
import { utcToDate } from '@/lib/utill';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import moment from 'moment';

import RESET_ORDER from '@/graphql/order/resetOrderToZero.graphql'

export const defaultProps = {
  pageView: "list",
  columns: [
    'serial', 'store', 'original_order', 'delivery_slot', 
    // 'actions', 
    { key: 'status' }, 
    { key: 'pickup_allow' }, 
    { key: 'createdAt' }, 
    { key: 'updatedAt' }
  ]
};


const OrdersList: React.FC<OrdersListProps> = ({ 
  pagination, pageView = defaultProps.pageView, columns = defaultProps.columns, loading, filter, 
  dataSource, fetchData, busy, setBusy, searchFilterConfig, ...props
}) => {
  const router = useRouter()
  const session = useAppSelector((state: any) => state.session);
  const settings = useAppSelector(getSettings)
  const isStoreUser = !!(session?.user?.store?._id);
  const getOrderPreviewHref = (order: any) => {
    const storeId = order?.store?._id || order?._id_store || session?.user?.store?._id;
    return storeId
      ? `${adminRoot}/store/${storeId}/orders/preview/${order?.serial}`
      : `${adminRoot}/orders/preview/${order?.serial}`;
  };

  const [resetOrder, resetOrder_results] = useMutation<any>(RESET_ORDER);
  const canResetOrder = security.verifyRole('106.9', session.user.permissions); // Order reset permission

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    if (fetchData) {
      fetchData({
        pagination:{
          pageSize: pagination.pageSize,
          current: pagination.page,
        }
      })
    }
  };

  const handleResetOrder = async (order: any) => {
    if (setBusy) setBusy(true);

    try {
      const processedResult = await resetOrder({
        variables: {
          _id_order: order._id
        }
      })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.resetOrderToZero }))
        .catch(catchApolloError)

      if (processedResult.error) {
        message.error(`Failed to reset order: ${processedResult.error.message}`);
        return;
      }

      if (processedResult.success) {
        const resetData = processedResult.data;
        message.success(
          <div>
            <div><strong>Order {order.serial} has been successfully reset to zero.</strong></div>
            <div style={{ fontSize: '12px', marginTop: 4 }}>
              Resources released:
              {resetData.resources_released?.picker_baskets_released && ' ✓ Picker baskets'}
              {resetData.resources_released?.delivery_baskets_released && ' ✓ Delivery baskets'}
              {resetData.resources_released?.staff_assignments_cleared && ' ✓ Staff assignments'}
              {resetData.resources_released?.till_queue_cleared && ' ✓ Till queue'}
              {resetData.resources_released?.inventory_restored && ' ✓ Inventory'}
            </div>
          </div>
        );
        // Refresh the data
        if (fetchData) fetchData({ filter, pagination });
      }
    } catch (error) {
      console.error('Error resetting order:', error);
      catchApolloError(error);
      message.error('Failed to reset order. Please try again.');
    } finally {
      if (setBusy) setBusy(false);
    }
  };

  const _columns = [
    { title: 'Serial', _dataIndex: 'serial', key: 'serial', align: 'left', render: (__:any, rec:any) => {
      const { serial, customer } = rec;
      return (<>
        <Link href={getOrderPreviewHref(rec)}>{serial}</Link>
        <div><b>Customer:</b> {customer.name}</div>
      </>)
    } },
    { title: 'Store', dataIndex: ['zone', 'title'], key: 'store', align: 'left', render: (_: any, rec: any) => (<div>
        <div>{rec.store.title}</div>
        <div><b>ZONE:</b> {rec.zone.title}</div>
      </div>) },
    { title: 'Order', dataIndex: ['original_order', 'totals'], key: 'original_order', width: 150, align: 'left', render: (totals:any, rec:any) => {
      return (<div>
        {/* totals.saved */}
        <div><b>Total Items:</b> {totals.totalQuantity}</div>
        {/* totals.subtotal */}
        {/* totals.discountTotal */}
        {/* totals.shipping */}
        {/* totals.taxRate */}
        {/* totals.taxAmount */}
        <div><b>{settings.currency}</b> {totals.grandTotal}</div>
      </div>)
    } },
    { title: 'Slot', dataIndex: 'delivery_slot', key: 'delivery_slot', width: 120, align: 'left', render: (delivery_slot:any, rec:any) => {
      return (<div>
        <div>{String(delivery_slot.start_time).padStart(4, '0')} ~ {String(delivery_slot.end_time).padStart(4, '0')}</div>
        <div>{String(delivery_slot.day).toUpperCase()}</div>
      </div>)
    } },
    {
      title: 'Status', dataIndex: ['status', 'order'], key: 'status', width: 220, align: 'left', render: (__: any, { current_stage, status, lock_type }: any) => (<div>
        <div><b>Stage:</b> {current_stage}</div>
        <div><b>Status:</b> {status.order}</div>
        {lock_type && <div><Icon icon="lock" /> {lock_type}</div>}
      </div>) },
    { title: 'Pickup Allowrd', dataIndex: ['pickup_allow'], key: 'pickup_allow', width: 50, align: 'center', render: (pickup_allow:boolean, rec:any) => (<Tag color={pickup_allow ? 'green' : 'red'}>{pickup_allow ? "YES" : "NO"}</Tag>) },
    { title: 'Created', dataIndex: ['createdAt'], key: 'createdAt', width: 115, align: 'left', render: (createdAt:string, rec:any) => (<div>{moment(createdAt).format(defaultDateTimeFormat)}</div>) },
    { title: 'Updated', dataIndex: ['updatedAt'], key: 'updatedAt', width: 115, align: 'left', render: (updatedAt:string, rec:any) => (<div>{moment(updatedAt).format(defaultDateTimeFormat)}</div>) },

    // Actions column
    { title: 'Actions', key: 'actions', width: 100, align: 'center',
      render: (_:any, record:any) => (
        <Space size="small">
          {canResetOrder && record.status?.order !== 'cancelled' && record.status?.order !== 'completed' && (
            <Popconfirm
              title="Reset Order to Zero"
              description={
                <div>
                  <p>This will completely reset the order and release all resources:</p>
                  <ul style={{ marginLeft: 16, fontSize: '12px' }}>
                    <li>Release all assigned baskets</li>
                    <li>Clear staff assignments</li>
                    <li>Remove from till queue</li>
                    <li>Restore inventory allocation</li>
                    <li>Cancel all progress data</li>
                  </ul>
                  <p><strong>Are you sure you want to continue?</strong></p>
                </div>
              }
              onConfirm={() => handleResetOrder(record)}
              okText="Yes, Reset Order"
              cancelText="Cancel"
              okType="danger"
              placement="left"
            >
              <IconButton
                icon="refresh"
                color="red"
                onClick={() => {}}
                tooltip="Reset order to zero and release all resources"
              />
            </Popconfirm>
          )}

          <IconButton
            icon="eye"
            onClick={() => router.push(getOrderPreviewHref(record))}
            tooltip="View order details"
          />
        </Space>
      ),
    },

  ].map(o=>{
    const col = columns.find(c => (c.key === o.key || c === o.key))
    
    if (!col) return null;
    if (col === true || col === false || _.isString(col)) return o;

    return { ...o, ...col }
  }).filter(o=>o !== null)
  


  return (<>
    <PageHeader
      title={<>{(props as any).title || "Orders"}</>}
      sub={<div>{pagination ? `Total ${pagination.total || 0} records found` : null}</div>}
    >
      <Button onClick={() => fetchData && fetchData({})}>Refresh</Button>
    </ PageHeader>

    <Page>
      {!(searchFilterConfig && searchFilterConfig.hide===true) && <Row>
        <Col flex="auto">
          Order filter
          {/* <ProductFilter exclude={props?.searchFilterConfig?.exclude} onChange={fetchData} defaultValue={filter} /> */}
        </Col>
        <Col flex="350px" style={{ paddingLeft: 20 }}>
          Order barcode filter
          {/* <ProductBarcodeFilter onEditClick={(record) => router.push(`${adminRoot}/product/${record._id}/view`)} /> */}
        </Col>
      </Row>}

      <Table
        bordered
        loading={loading || busy}
        columns={_columns}
        dataSource={dataSource || undefined}
        // total={(pagination && pagination.total) || 0}
        pagination={pagination as any || false}
        // pageSize={(pagination && pagination.pageSize)}
        // current={(pagination && pagination.current) || 1}
        rowClassName={(record => {
          return record.status == 'offline' ? 'disabled-table-row' : "";
        })}
        onChange={(pagination: any, filters: any, sorter: any) => handleTableChange({ page: pagination.current, pageSize: pagination.pageSize }, filters, sorter)}
      />
    </Page>

    <DevBlock obj={dataSource} />

  </>)

}

export default OrdersList;
