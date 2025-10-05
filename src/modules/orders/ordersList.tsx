'use client'

import React, { useState, useEffect } from 'react'
import { Popconfirm, Alert, message, Row, Col, Divider, Radio, Modal, Space, Tag } from 'antd';
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { Table, Loader, Button, Avatar, DataGrid, Icon, IconButton, DeleteButton, DevBlock } from '@_/components';
// import { ProductBarcodeFilter, ProductGridItem, ProductFilter } from './components'
import Link from 'next/link';
import { adminRoot, defaultDateTimeFormat } from '@_/configs';
import { useRouter } from 'next/navigation';
import security from '@_/lib/security';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';
import { useAppSelector } from '@_/rStore/hooks';
import { getSettings } from '@_/rStore/slices/systemSlice';
import _ from 'lodash'

import { OrdersListProps, SearchFilterConfig } from '@_/types/order';
import { utcToDate } from '@_/lib/utill';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
import moment from 'moment';

import RESET_ORDER from '@_/graphql/order/resetOrderToZero.graphql'

const defaultProps = {
  pageView: "list",
  columns: ['serial', 'store', 'customer', 'original_order', 'delivery_slot', 'actions', 
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
  const session = useAppSelector((state) => state.session);
  const settings = useAppSelector(getSettings)
  const isStoreUser = !!(session?.user?.store?._id);

  const [resetOrder, resetOrder_results] = useMutation(RESET_ORDER);
  const canResetOrder = security.verifyRole('106.9', session.user.permissions); // Order reset permission

  const handleTableChange = (pagination, filters, sorter) => {
    fetchData({
      pagination:{
        pageSize: pagination.pageSize,
        current: pagination.page,
      }
    })
  };

  const handleResetOrder = async (order) => {
    setBusy(true);
    try {
      const result = await resetOrder({
        variables: {
          _id_order: order._id
        }
      });

      const processedResult = checkApolloRequestErrors({
        results: result,
        allowEmpty: false,
        parseReturn: (r) => r?.data?.resetOrderToZero
      });

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
        fetchData({ filter, pagination });
      }
    } catch (error) {
      console.error('Error resetting order:', error);
      catchApolloError(error);
      message.error('Failed to reset order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const _columns = [
    // _id
    { title: 'Serial', _dataIndex: 'serial', key: 'serial', align: 'left', render: (__, { serial, current_stage }) => {
      return (<>
        <Link href={`${adminRoot}/orders/preview/${serial}`}>{serial}</Link>
        <div>Stage: {current_stage}</div>
      </>)
    } },
    { title: 'Store', dataIndex: ['zone', 'title'], key: 'store', align: 'left', render:(_, rec) => {
      return (<div>
        <div>{rec.store.title}</div>
        <div>ZONE: {rec.zone.title}</div>
      </div>)
    } },
    { title: 'Customer', dataIndex: ['customer','name'], key: 'customer', align: 'left' },
    { title: 'Order', dataIndex: ['original_order', 'totals'], key: 'original_order', width: 150, align: 'left', render: (totals, rec) => {
      return (<div>
        {/* totals.saved */}
        <div>Total Items: {totals.totalQuantity}</div>
        {/* totals.subtotal */}
        {/* totals.discountTotal */}
        {/* totals.shipping */}
        {/* totals.taxRate */}
        {/* totals.taxAmount */}
        <div>Total: {settings.currency}{totals.grandTotal}</div>
      </div>)
    } },
    { title: 'Slot', dataIndex: 'delivery_slot', key: 'delivery_slot', width: 140, align: 'left', render: (delivery_slot, rec) => {
      return (<div>
        <div>{String(delivery_slot.start_time).padStart(4, '0')} ~ {String(delivery_slot.end_time).padStart(4, '0')}</div>
        <div>{String(delivery_slot.day).toUpperCase()}</div>
      </div>)
    } },
    { title: 'Status', dataIndex: ['status', 'order'], key: 'status', width: 100, align: 'left' },
    { title: 'Pickup Allowrd', dataIndex: ['pickup_allow'], key: 'pickup_allow', width: 50, align: 'center', render: (pickup_allow, rec) => (<Tag color={pickup_allow ? 'green' : 'red'}>{pickup_allow ? "YES" : "NO"}</Tag>) },
    { title: 'Created', dataIndex: ['createdAt'], key: 'createdAt', width: 115, align: 'left', render: (createdAt, rec) => (<div>{moment(createdAt).format(defaultDateTimeFormat)}</div>) },
    { title: 'Updated', dataIndex: ['updatedAt'], key: 'updatedAt', width: 115, align: 'left', render: (updatedAt, rec) => (<div>{moment(updatedAt).format(defaultDateTimeFormat)}</div>) },

    // Actions column
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
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
            onClick={() => router.push(`${adminRoot}/orders/preview/${record.serial}`)}
            tooltip="View order details"
          />
        </Space>
      ),
    },

  ].map(o=>{
    let col = columns.find(c => (c.key === o.key || c === o.key))
    
    if (!col) return null;
    if (col === true || col === false || _.isString(col)) return o;

    return { ...o, ...col }
  }).filter(o=>o !== null)
  


  return (<>
    <PageHeader 
      title={<>{props.title || "Orders"}</>}
      sub={<div>{pagination ? `Total ${pagination.total || 0} records found` : null}</div>}
    />

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
        dataSource={dataSource || null}
        // total={(pagination && pagination.total) || 0}
        pagination={pagination || false}
        // pageSize={(pagination && pagination.pageSize)}
        // current={(pagination && pagination.current) || 1}
        rowClassName={(record => {
          return record.status == 'offline' ? 'disabled-table-row' : "";
        })}
        onChange={({ current, pageSize }: { current: number, pageSize: number }) => handleTableChange({ page: current, pageSize })}
      />
    </Page>

    <DevBlock obj={dataSource} />

  </>)

}

export default OrdersList;
