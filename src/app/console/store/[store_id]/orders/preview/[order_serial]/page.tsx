'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client/react'
import { DevBlock, Loader, Icon, Button, IconButton, OrderItemsTable } from '@/components'
import { PageHeader } from '@/template'
import { Page } from '@/template/page'
import { Alert, Card, Descriptions, Tag, Space, Typography, Divider, Row, Col, Timeline, Empty } from 'antd'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import moment from 'moment';
import { defaultDateTimeFormat, adminRoot } from '@/configs';

import ORDER from '@/graphql/order/getOrignalOrder.graphql'
import { RevertOrderModal } from '../../components'

const { Title, Text } = Typography;

function OrderPreview() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null)
    const { order_serial, store_id } = useParams();
    const settings = useAppSelector(getSettings);
    const [isRevertModalVisible, setIsRevertModalVisible] = useState(false);
    const [revertTargetStage, setRevertTargetStage] = useState('');

    const [getOrignalOrder, { called, loading, data }] = useLazyQuery<any>(ORDER, { fetchPolicy: 'network-only' });

    async function getchData(){
        setError(null)
        const orderIdentifier = Array.isArray(order_serial) ? order_serial[0] : order_serial;
        let results = await getOrignalOrder({
            variables: {
                filter: JSON.stringify({
                    $or: [
                        { serial: orderIdentifier },
                        // { _id: orderIdentifier }
                    ]
                })
            }
        }).then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: { data?: { order?: any } }) => rr?.data?.order }))
        .catch(catchApolloError)

        if (results?.error) return setError(results.error.message || 'Invalid response')
    }

    const handleRevertClick = (targetStage: string) => {
        setRevertTargetStage(targetStage);
        setIsRevertModalVisible(true);
    };

    const canRevertTo = (targetStage: string) => {
        if (!data?.order) return false;

        const currentStage = data.order.current_stage;
        const stageOrder = ['pending', 'picking', 'picking-complete', 'till_verification', 'ready-to-dispatch', 'delivering', 'delivered', 'completed'];

        const currentIndex = stageOrder.indexOf(currentStage);
        const targetIndex = stageOrder.indexOf(targetStage);

        // Can only revert backwards
        return targetIndex < currentIndex && !['cancelled', 'delivered', 'completed'].includes(currentStage);
    };

    useEffect(() => {
        if (!order_serial || called) return;
        getchData();
    }, [order_serial, called])

    if (loading) return <Loader loading={true} />
    if (!data?.order) return <Alert title="Error" description="Order not found!" type="error" showIcon />
    if (error) return <Alert title="Error" description={error} showIcon type="error" />

    const order = data.order;
    const originalOrder = order.original_order;
    const dispatchBaskets =
        order.current_order?.baskets?.length
            ? order.current_order.baskets
            : (order.processing_stages?.till_verification?.baskets
                || order.processing_stages?.delivery?.baskets
                || []);
    const totals = originalOrder?.totals || order?.current_order?.totals || {
        saved: 0,
        totalQuantity: 0,
        subtotal: 0,
        discountTotal: 0,
        shipping: 0,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: 0
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        return `${settings?.currency || 'RS'} ${(safeAmount).toFixed(2)}`;
        // return `${settings?.currency || 'RS'} ${(safeAmount / 100).toFixed(2)}`;
    };

    // Status colors
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'orange',
            processing: 'blue',
            completed: 'green',
            cancelled: 'red',
            paid: 'green',
            unpaid: 'red',
            refunded: 'purple',
        };
        return colors[status] || 'default';
    };

    const getActivityColor = (action: string): string => {
        const colors: Record<string, string> = {
            order_created: 'blue',
            picking_started: 'cyan',
            picking_completed: 'cyan',
            till_started: 'geekblue',
            till_verified: 'geekblue',
            order_reset: 'orange',
            collected_by_driver: 'purple',
            on_the_way: 'magenta',
            on_the_way_cleared: 'default',
            delivered: 'green',
            completed: 'green',
            cancelled: 'red',
            returned: 'volcano',
            baskets_returned: 'gold',
            wallet_settled: 'gold',
        };
        return colors[action] || 'gray';
    };

    const formatActivityLabel = (action: string) =>
        (action || '')
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

    const activityLogs = [...(order.activity_logs || [])].sort((a: any, b: any) => {
        const aTime = a?.at ? new Date(a.at).getTime() : 0;
        const bTime = b?.at ? new Date(b.at).getTime() : 0;
        return bTime - aTime; // newest first for audit reading
    });


    return (<div>
        <PageHeader title={<><IconButton icon="arrow-left" onClick={() => router.back()} /> Order Details</>} sub={<div>Order #{order_serial}</div>}>
            <Space>
                {canRevertTo('pending') && (
                    <Button
                        type="default"
                        danger
                        onClick={() => handleRevertClick('pending')}
                        icon={<Icon icon="undo" />}
                    >
                        Revert to Pending
                    </Button>
                )}
                {canRevertTo('picking-complete') && (
                    <Button
                        type="default"
                        onClick={() => handleRevertClick('picking-complete')}
                        icon={<Icon icon="undo" />}
                    >
                        Revert to Picking Complete
                    </Button>
                )}
                {canRevertTo('ready-to-dispatch') && (
                    <Button
                        type="default"
                        onClick={() => handleRevertClick('ready-to-dispatch')}
                        icon={<Icon icon="undo" />}
                    >
                        Revert to Ready to Dispatch
                    </Button>
                )}
                {/* <Button icon={<Icon icon="arrow-left" />} onClick={() => router.push(`${adminRoot}/store/${store_id}/orders`)}>Back to Orders</Button> */}
            </Space>
        </PageHeader>

        <Page>
            {/* Order Status Cards */}
            <Row gutter={[10, 10]} style={{ marginBottom: 24 }}>
                <Col span={6}><Card><div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Order Status</Text>
                        <div style={{ marginTop: 8 }}>
                            <Tag color={getStatusColor(order.status?.order)} style={{ fontSize: '14px' }}>
                                {(order.status?.order || 'N/A').toUpperCase()}
                            </Tag>
                        </div>
                </div></Card></Col>
                <Col span={6}><Card><div style={{ textAlign: 'center' }}>
                    <Text type="secondary">Payment Status</Text>
                    <div style={{ marginTop: 8 }}>
                        <Tag color={getStatusColor(order.status?.payment)} style={{ fontSize: '14px' }}>
                            {(order.status?.payment || 'N/A').toUpperCase()}
                        </Tag>
                    </div>
                </div></Card></Col>
                <Col span={6}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary">Fulfillment Status</Text>
                            <div style={{ marginTop: 8 }}>
                                <Tag color={getStatusColor(order.status?.fulfillment)} style={{ fontSize: '14px' }}>
                                    {(order.status?.fulfillment || 'N/A').toUpperCase()}
                                </Tag>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary">Order Total</Text>
                            <div style={{ marginTop: 8 }}>
                                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                    {formatCurrency(totals?.grandTotal)}
                                </Title>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col span={16}>
                    {/* Order Items */}
                    <Card title={`Order Items (${originalOrder?.items?.length || 0} items)`} variant="outlined" style={{ marginBottom: 10 }}>
                        <OrderItemsTable items={originalOrder?.items || []} totals={totals} />
                    </Card>

                    {/* Order Summary */}
                    <Row gutter={16}>
                        <Col span={12}>
                            {/* Applied Vouchers */}
                            {originalOrder?.vouchers && originalOrder.vouchers.length > 0 && (<Card title="Applied Vouchers" variant="outlined" style={{ marginBottom: 24 }}>
                                <Space orientation="vertical" style={{ width: '100%' }}>
                                    {originalOrder.vouchers.map((voucher: any, idx: number) => (
                                        <div key={idx} style={{ padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                                            <div><strong>{voucher.title}</strong></div>
                                            {voucher.code && <Text type="secondary">Code: {voucher.code}</Text>}
                                        </div>
                                    ))}
                                </Space>
                            </Card>)}

                            {/* Customer Feedback */}
                            {order.customer_feedback && (<Card title="Customer Feedback" variant="outlined">
                                <Text>{order.customer_feedback}</Text>
                            </Card>)}
                        </Col>

                        <Col span={12}>
                            {/* Order Totals */}
                            <Card title="Order Summary" variant="outlined">
                                <div style={{ fontSize: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                        <Text>Items ({totals?.totalQuantity || 0}):</Text>
                                        <Text>{formatCurrency(totals?.subtotal || 0)}</Text>
                                    </div>
                                    {totals?.discountTotal > 0 && (<>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                            <Text style={{ color: '#52c41a' }}>Discount:</Text>
                                            <Text style={{ color: '#52c41a' }}>-{formatCurrency(totals.discountTotal)}</Text>
                                        </div>
                                    </>)}
                                    {totals?.saved > 0 && (<>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                            <Text style={{ color: '#52c41a' }}>You Saved:</Text>
                                            <Text style={{ color: '#52c41a' }}>-{formatCurrency(totals.saved)}</Text>
                                        </div>
                                    </>)}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                        <Text>Shipping:</Text>
                                        <Text>{formatCurrency(totals?.shipping || 0)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                        <Text>Tax ({totals?.taxRate || 0}%):</Text>
                                        <Text>{formatCurrency(totals?.taxAmount || 0)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                                        <Title level={4} style={{ margin: 0 }}>Grand Total:</Title>
                                        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>{formatCurrency(totals?.grandTotal || 0)}</Title>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                </Col>

                <Col span={8}><Space size={10} orientation='vertical'>
                    <Card title="Order Information" variant="outlined">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item><Descriptions column={2} size="small">
                                <Descriptions.Item label="Serial">{order.serial}</Descriptions.Item>
                                <Descriptions.Item label="ID">{order._id}</Descriptions.Item>
                            </Descriptions></Descriptions.Item>
                            <Descriptions.Item><Descriptions column={2} size="small">
                                <Descriptions.Item label="Store">{order.store?.title}</Descriptions.Item>
                                <Descriptions.Item label="Zone">{order.zone?.title}</Descriptions.Item>
                            </Descriptions></Descriptions.Item>
                            <Descriptions.Item><Descriptions column={2} size="small">
                                <Descriptions.Item label="Status">{order.status?.order || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Current Stage"><Tag color="blue">{order.current_stage || 'N/A'}</Tag></Descriptions.Item>
                            </Descriptions></Descriptions.Item>
                            <Descriptions.Item label="Pickup Allowed">
                                <Tag color={order.pickup_allow ? 'green' : 'red'}>{order.pickup_allow ? 'YES' : 'NO'}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item><Descriptions column={2} size="small">
                                <Descriptions.Item label="Created At">{moment(order.createdAt).format(defaultDateTimeFormat)}</Descriptions.Item>
                                <Descriptions.Item label="Updated At">{moment(order.updatedAt).format(defaultDateTimeFormat)}</Descriptions.Item>
                            </Descriptions></Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Delivery Slot Information */}
                    {order.delivery_slot && (<Card title="Delivery Slot" variant="outlined">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Time Slot">
                                <Tag color="blue">{order.delivery_slot.day?.toUpperCase()}</Tag> {String(order.delivery_slot.start_time).padStart(4, '0')} - {String(order.delivery_slot.end_time).padStart(4, '0')}
                            </Descriptions.Item>
                        </Descriptions>

                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Slot Dates">
                                {order.delivery_slot.start_date && moment(order.delivery_slot.start_date).format(defaultDateTimeFormat)}
                                {' to '}
                                {order.delivery_slot.end_date && moment(order.delivery_slot.end_date).format(defaultDateTimeFormat)}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>)}

                    <Card title="Customer Information" variant="outlined">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Customer Name">{order.customer?.name}</Descriptions.Item>
                            <Descriptions.Item label="Customer ID">{order.customer?._id}</Descriptions.Item>
                            {order.shippingAddress && (<Descriptions.Item label="Shipping Address">
                                <div>{order.shippingAddress.full_address}</div>
                                <div>{order.shippingAddress?.city?.title || 'N/A'}</div>
                            </Descriptions.Item>)}
                            {order.delivery_note && (<Descriptions.Item label="Delivery Note">
                                <Text italic>{order.delivery_note}</Text>
                            </Descriptions.Item>)}
                        </Descriptions>
                    </Card>

                    <Card
                        title={`Dispatch Baskets (${dispatchBaskets.length})`}
                        variant="outlined"
                    >
                        {dispatchBaskets.length > 0 ? (
                            <Space wrap size={[8, 8]}>
                                {dispatchBaskets.map((basket: any, index: number) => (
                                    <Tag
                                        key={basket._id || basket.barcode || index}
                                        color="blue"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingInline: 10,
                                            marginInlineEnd: 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 2,
                                                background: basket.color || '#d9d9d9',
                                                border: '1px solid #bfbfbf',
                                                display: 'inline-block',
                                            }}
                                        />
                                        <span>{basket.title || 'Basket'}</span>
                                        {basket.barcode && (
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {basket.barcode}
                                            </Text>
                                        )}
                                    </Tag>
                                ))}
                            </Space>
                        ) : (
                            <Text type="secondary">No dispatch baskets attached to this order.</Text>
                        )}
                    </Card>

                    {/* Payment Information */}
                    {order.payment && (<Card title="Payment Information" variant="outlined">
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Payment Method"><Tag color="blue">{order.payment.method?.toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Transaction ID">{order.payment.transactionId || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Amount Charged">{formatCurrency(order.payment.amount_charged || 0)}</Descriptions.Item>
                            <Descriptions.Item label="Amount Refunded">{formatCurrency(order.payment.amount_refunded || 0)}</Descriptions.Item>
                            <Descriptions.Item label="Final Amount"><strong style={{ fontSize: '16px' }}>{formatCurrency(order.payment.final_amount || 0)}</strong></Descriptions.Item>
                            <Descriptions.Item label="Payment Date">{order.payment.createdAt && moment(order.payment.createdAt).format(defaultDateTimeFormat)}</Descriptions.Item>
                        </Descriptions>
                    </Card>)}

                </Space></Col>

            </Row>



            {/* Lock Information */}
            {order.locked_by && (<Alert title="Order Locked" type="warning" showIcon icon={<Icon icon="lock" />} style={{ marginBottom: 24 }}
                description={<div>
                    <div>Locked by: {order.locked_by}</div>
                    <div>Lock Type: {order.lock_type}</div>
                    <div>Locked at: {moment(order.locked_at).format(defaultDateTimeFormat)}</div>
                    <div>Lock expires at: {moment(order.lock_expires_at).format(defaultDateTimeFormat)}</div>
                </div>}
            />)}

            {/* Activity / audit log */}
            <Card
                title={`Activity Log (${activityLogs.length})`}
                variant="outlined"
                style={{ marginBottom: 24 }}
                extra={order.sub_status?.code === 'on_the_way' && order.sub_status?.eta_minutes != null
                    ? <Tag color="magenta">On the Way · ETA ~{order.sub_status.eta_minutes} min</Tag>
                    : null}
            >
                {activityLogs.length < 1 ? (
                    <Empty description="No activity recorded yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <Timeline
                        items={activityLogs.map((log: any) => {
                            const coords = log.location?.coordinates;
                            const lat = Array.isArray(coords) ? coords[1] : null;
                            const lng = Array.isArray(coords) ? coords[0] : null;
                            const eta = log.meta?.eta_minutes;
                            const distance = log.meta?.distance_meters;

                            return {
                                key: log._id || `${log.action}-${log.at}`,
                                color: getActivityColor(log.action),
                                content: (
                                    <div>
                                        <Space wrap size={[8, 4]} style={{ marginBottom: 4 }}>
                                            <Tag color={getActivityColor(log.action)}>{formatActivityLabel(log.action)}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {log.at ? moment(log.at).format(defaultDateTimeFormat) : '—'}
                                            </Text>
                                            {log.by?.name && (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    by {log.by.name}
                                                </Text>
                                            )}
                                        </Space>
                                        <div>{log.message || formatActivityLabel(log.action)}</div>
                                        {(eta != null || distance != null || (lat != null && lng != null)) && (
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                                {eta != null ? `ETA ~${eta} min` : ''}
                                                {eta != null && distance != null ? ' · ' : ''}
                                                {distance != null ? `${Math.round(distance)} m` : ''}
                                                {(eta != null || distance != null) && lat != null ? ' · ' : ''}
                                                {lat != null && lng != null ? `@ ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : ''}
                                            </Text>
                                        )}
                                    </div>
                                ),
                            };
                        })}
                    />
                )}
            </Card>

            {/* Debug Information */}
            <Divider />
            <DevBlock obj={order} />

        </Page>

        {/* Revert Order Modal */}
        <RevertOrderModal
            open={isRevertModalVisible}
            order={order}
            targetStage={revertTargetStage}
            storeId={order?.store?._id || (Array.isArray(store_id) ? store_id[0] : store_id) || ''}
            onClose={() => {
                setIsRevertModalVisible(false);
                setRevertTargetStage('');
            }}
            onSuccess={() => getchData()}
        />
    </div>)

}

export default OrderPreview;
