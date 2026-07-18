'use client'
import React, { ReactNode, useState } from 'react'
import { Table } from './table';
import Link from 'next/link';
import { adminRoot, defaultDateTimeFormat } from '@/configs';
import { useAppSelector } from '@/rStore/hooks';
import BarcodePackage from 'react-barcode';
import { getSettings } from '@/rStore/slices/systemSlice';
import { BarcodeScanner } from './BarcodeScanner';
import { Icon } from './icon';
import { message, Popconfirm, Space, Tag, Typography } from 'antd';
import moment from 'moment';
import _ from 'lodash';
// import dayjs from 'dayjs';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Button, IconButton } from './button';
import { useRouter } from 'next/navigation';
import { PlayCircleOutlined, UserOutlined, ShoppingOutlined, ClockCircleOutlined, PauseCircleOutlined, LogoutOutlined, LoginOutlined, LockOutlined } from '@ant-design/icons';
import { utcToDate } from '@/lib/utill';

import RESET_ORDER from '@/graphql/order/resetOrderToZero.graphql'

const { Title, Text } = Typography;

const ResetButton = ({ handleResetOrder, size='small' }: { handleResetOrder: Function, size?: 'small' | 'middle' | 'large' }) => {
    const [busy, setBusy] = useState(false)

    async function _handleResetOrder(){
        setBusy(true)
        await handleResetOrder()
        setBusy(false)
    }

    return (<Popconfirm title="Reset Order to Zero"
        description={<div>
            <p>This will completely reset the order and release all resources:</p>
            <ul style={{ marginLeft: 16, fontSize: '12px' }}>
                <li>Release all assigned baskets</li>
                <li>Clear staff assignments</li>
                <li>Remove from till queue</li>
                <li>Restore inventory allocation</li>
                <li>Cancel all progress data</li>
            </ul>
            <p><strong>Are you sure you want to continue?</strong></p>
        </div>}
        onConfirm={_handleResetOrder}
        okText="Yes, Reset Order"
        cancelText="Cancel"
        okType="danger"
        placement="left"
    >
        <IconButton
            size={size}
            icon="refresh"
            color="red"
            onClick={() => { }}
            loading={busy}
            tooltip="Reset order to zero and release all resources"
        />
    </Popconfirm>)
}

interface OrderTableProps {
    title?: string;
    busy?: boolean;
    columns: any[];
    dataSource: any[] | undefined | null;
    pagination: any;
    rowClassName?: Function | string | any;
    handleTableChange?: Function;
    refresh?: Function;
    // actions?: {
    //     reset?: boolean;
    //     till_verification?: boolean;
    // } | undefined;
    scroll?: any;
    rowKey?: string;
    actions?: ReactNode | ReactNode[];
}
export function OrderTable({ 
    busy, columns, dataSource, pagination, rowClassName, handleTableChange, refresh,
    title, scroll, rowKey, actions
}: OrderTableProps) {
    const [loading, setLoading] = useState(false)
    const settings = useAppSelector(getSettings);

    // console.log("OrderTable: ", dataSource)

    const router = useRouter()
    const getOrderPreviewHref = (order: any) => {
        const storeId = order?.store?._id || order?._id_store;
        return storeId
            ? `${adminRoot}/store/${storeId}/orders/preview/${order?.serial}`
            : `${adminRoot}/orders/preview/${order?.serial}`;
    };

    const [resetOrder, resetOrder_results] = useMutation<any>(RESET_ORDER);

    const tableProps: any = {}
    if (handleTableChange) Object.assign(tableProps, {
        onChange: ({ current, pageSize }: { current: number, pageSize: number }) => handleTableChange({ page: current, pageSize })
    })

    const handleResetOrder = async (order:any) => {
        setLoading(true)

        const processedResult = await resetOrder({
            variables: { _id_order: order._id }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr:any) => rr?.data?.resetOrderToZero }))
            .catch(catchApolloError)

        setLoading(false)

        if (processedResult.error) {
            message.error(`Failed to reset order: ${processedResult.error.message}`);
            return;
        }

        if (processedResult.success) {
            const resetData = processedResult.data;
            message.success(<div>
                <div><strong>Order {order.serial} has been successfully reset to zero.</strong></div>
                <div style={{ fontSize: '12px', marginTop: 4 }}>
                    Resources released:
                    {resetData.resources_released?.picker_baskets_released && ' ✓ Picker baskets'}
                    {resetData.resources_released?.delivery_baskets_released && ' ✓ Delivery baskets'}
                    {resetData.resources_released?.staff_assignments_cleared && ' ✓ Staff assignments'}
                    {resetData.resources_released?.till_queue_cleared && ' ✓ Till queue'}
                    {resetData.resources_released?.inventory_restored && ' ✓ Inventory'}
                </div>
            </div>);
            // Refresh the data
            if (refresh) refresh()
        }
    };


    const _columns = [
        { title: 'Serial', _dataIndex: 'serial', key: 'serial', align: 'left', width: 270,
            render: (__: any, rec: any) => {
                const { current_order, serial } = rec;
                return (<>
                    {/* <Link href={getOrderPreviewHref(rec)}>{serial}</Link> */}
                    <div><Link href={getOrderPreviewHref(rec)}><BarcodePackage
                        value={serial} //{`doReadyForDispatch`}
                        width={1.5}
                        height={30}
                        format={"CODE128"}
                        displayValue={serial}
                    /></Link></div>
                    {/* {(current_order && current_order.baskets) && <div>
                        {current_order?.baskets?.map((basket: any, i: number) => (<Tag key={i}>{basket.title}</Tag>))}
                    </div>} */}
                </>)
            }
        },
        { title: 'Customer', dataIndex: 'customer', key: 'customer',
            render: (customer: any) => (<Space>
                <UserOutlined />
                <Text>{customer?.name || 'N/A'}</Text>
            </Space>),
        },
        { title: 'Baskets', width: 170, key: 'baskets', dataIndex: ['processing_stages', 'picking', 'handled_by'],
            render:(___:string, rec:any) => {
                if (rec?.processing_stages?.till_verification?.baskets?.length)
                    return <Space>{rec.processing_stages.till_verification.baskets.map((basket: any, i: number) => (<Tag color='gray' key={i}>{basket.title}</Tag>))}</Space>
                return <Space>{rec?.processing_stages?.picking?.baskets?.map((basket: any, i: number) => (<Tag color='gray' key={i}>{basket.title}</Tag>))}</Space>
            }
        },
        { title: 'Picker Baskets', width: 170, key: 'picker_baskets', dataIndex: ['processing_stages', 'picking', 'baskets'],
            render: (baskets:any, rec:any) => {
                if (!baskets) return null;
                return baskets.map((b: any, i: number) => (<Tag key={i}>{b.title}</Tag>))
            }
        },
        { title: 'Dispatch Baskets', width: 170, key: 'dispatch_baskets', dataIndex: ['processing_stages', 'till_verification', 'baskets'],
            render: (baskets:any, rec:any) => {
                if (!baskets) return null;
                return baskets.map((b: any, i: number) => (<Tag key={i}>{b.title}</Tag>))
            }
        },
        { title: 'Picker', width: 180, key: 'picker', dataIndex: ['processing_stages', 'picking', 'handled_by'],
            render: (handledBy: any) => (<Space>
                <UserOutlined style={{ color: '#52c41a' }} />
                <Text>{handledBy?.name || 'N/A'}</Text>
            </Space>),
        },
        { title: 'Store', dataIndex: ['zone', 'title'], key: 'store', align: 'left', 
            render: (_: any, rec: any) => (<div>
                <div>{rec?.store?.title}</div>
                <div><b>ZONE:</b> {rec?.zone?.title}</div>
            </div>)
        },
        { title: 'Order', dataIndex: 'order', key: 'order', width: 100, align: 'left', 
            render: (____: any, rec: any) => {
                let odr = rec.current_order || rec.original_order;

                return (<div>
                    {/* totals.saved */}
                    <div><span className='text-gray-400'><ShoppingOutlined /></span> {odr?.totals?.totalQuantity} items</div>
                    {/* totals.subtotal */}
                    {/* totals.discountTotal */}
                    {/* totals.shipping */}
                    {/* totals.taxRate */}
                    {/* totals.taxAmount */}
                    <div><span className='text-gray-400'>{settings.currency}</span> {odr?.totals?.grandTotal}</div>
                </div>)
            }
        },
        { title: 'Slot', dataIndex: 'delivery_slot', key: 'delivery_slot', width: 120, align: 'left', 
            render: (delivery_slot: any, rec: any) => {
                return (<div>
                    {/* <div>{String(delivery_slot.start_time).padStart(4, '0')} ~ {String(delivery_slot.end_time).padStart(4, '0')}</div>
                    <div>{String(delivery_slot.day).toUpperCase()}</div> */}
                    <div>{utcToDate(delivery_slot.start_date).format("ddd Do")}</div>
                    <div>{utcToDate(delivery_slot.start_date).format("HHmm")} ~ {String(delivery_slot.end_time).padStart(4, '0')}</div>
                </div>)
            }
        },
        { title: 'Status', dataIndex: ['status', 'order'], key: 'status', width: 220, align: 'left', 
            render: (__: any, { current_stage, status, locked_by, lock_type, is_locked_by_me, handledBy }: any) => (<div>
                <div><b className='text-gray-400'>Stage:</b> {current_stage}</div>
                <div><b className='text-gray-400'>Status:</b> {status.order}</div>
                {locked_by && <>
                    <div><Icon icon="lock" /> {lock_type}</div>
                    <Space>
                        <UserOutlined style={{ color: '#52c41a' }} />
                        {is_locked_by_me && <Tag color="orange">Locked by you</Tag>}
                    </Space>
                </>}
            </div>)
        },
        { title: 'Pickup Allowed', dataIndex: ['pickup_allow'], key: 'pickup_allow', width: 50, align: 'center', 
            render: (pickup_allow: boolean, rec: any) => (<Tag color={pickup_allow ? 'green' : 'red'}>{pickup_allow ? "YES" : "NO"}</Tag>)
        },
        { title: 'Created', dataIndex: ['createdAt'], key: 'createdAt', width: 115, align: 'left', 
            render: (createdAt: string) => createdAt && (<Space orientation="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {utcToDate(createdAt).format('HH:mm A')}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{utcToDate(createdAt).fromNow()}</Text>
                {/* <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(createdAt).isValid() ? dayjs(createdAt).fromNow() : "Invalid Date"}</Text> */}
            </Space>)
        },
        { title: 'Updated', dataIndex: ['updatedAt'], key: 'updatedAt', width: 115, align: 'left', 
            render: (updatedAt: string, rec: any) => (<div>{moment(updatedAt).format(defaultDateTimeFormat)}</div>)
        },
        { title: 'Actions', key: 'actions', width: 100, align: 'center',
            render: (_: any, record: any) => {
                if (actions) return actions;
                let hasActions = columns.find((o:any) => o.key=='actions')
                if (!hasActions) return null;

                return (<Space size="small">
                    {(hasActions?.options?.reset && record.current_stage !== 'pending') && (
                        <ResetButton size="small" handleResetOrder={() => handleResetOrder(record)} />
                    )}

                    {hasActions?.options?.till_verification && <>
                        {(record.locked_by && !record.is_locked_by_me) && <>
                            <Icon icon="lock" /> Locked by someone else
                        </>}

                        {((record.locked_by && record.is_locked_by_me) || !record.locked_by) && <>
                            <Button size="small" color="blue"
                                onClick={() => router.push(`${adminRoot}/store/${record.store._id}/till-verification/${record.serial}/verify`)}
                                icon={<PlayCircleOutlined />}>{record.is_locked_by_me ? 'Resume' : 'Start'}</Button>
                        </>}
                    </>}

                    {(record.locked_by && hasActions?.options?.till_verification) && <>
                        <Link href={`${adminRoot}/store/${record.store._id}/till-verification/${record.serial}/verify`}><Space size={2}>
                            <PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}
                        </Space></Link>
                    </>}

                    {/* <IconButton onClick={() => router.push(`${adminRoot}/orders/preview/${record.serial}`)} icon="eye" tooltip="View order details" /> */}
                </Space>)
            },
        },

    ].map(o => {
        let col = columns.find(c => (c === o.key || c.key === o.key))
        if (!col) return null;

        if (col === true || col === false || _.isString(col)) return o;

        return { ...o, ...col }
    }).filter(o => o !== null)


    return (<div>
        {/* <PageHeader 
              title={<>{title || "Orders"}</>}
              sub={<div>{pagination ? `Total ${pagination.total || 0} records found` : null}</div>}
            >
            {refresh && <Button onClick={() => refresh()}>Refresh</Button>}
        </ PageHeader> */}

        {/* <BarcodeScanner onScan={(val:string) => {
            if (!val) return;
            const thisOrder = dataSource?.find((o:any) => o.serial === val)
            if (!thisOrder) {
                console.log("Order not found: ", val)
                return;
            }
            const url = `${adminRoot}/store/${thisOrder.store._id}/till-verification/${thisOrder.barcode}/verify`;
            router.push(url)
        }} onError={console.log} /> */}

        <Table
            bordered
            loading={busy || loading}
            columns={_columns}
            dataSource={dataSource || []}
            pagination={pagination || false}
            rowClassName={rowClassName}
            scroll={scroll}
            rowKey={rowKey || "_id"}
            {...tableProps}
        />
    </div>)
}
