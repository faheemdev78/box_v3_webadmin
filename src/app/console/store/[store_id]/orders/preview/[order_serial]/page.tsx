'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation';
import { useLazyQuery, useMutation } from '@apollo/client/react'
import { DevBlock, Loader, Icon, Button } from '@/components'
import { PageHeader } from '@/template'
import { Page } from '@/template/page'
import { Alert, Card, Descriptions, Table, Tag, Space, Typography, Divider, Row, Col, Modal, Input, message } from 'antd'
import type { ColumnsType } from 'antd/es/table';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import moment from 'moment';
import { defaultDateTimeFormat, adminRoot } from '@/configs';

import ORDER from '@/graphql/order/getOrignalOrder.graphql'
import REVERT_ORDER_STAGE from '@/graphql/order/revertOrderStage.graphql'

const { Title, Text } = Typography;
const { TextArea } = Input;

function OrderPreview() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null)
    const { order_serial, store_id } = useParams();
    const settings = useAppSelector(getSettings);
    const [isRevertModalVisible, setIsRevertModalVisible] = useState(false);
    const [revertTargetStage, setRevertTargetStage] = useState('');
    const [revertReason, setRevertReason] = useState('');
    const [revertNotes, setRevertNotes] = useState('');

    const [getOrignalOrder, { called, loading, data }] = useLazyQuery<any>(ORDER, { fetchPolicy: 'network-only' });
    const [revertOrderStage, { loading: reverting }] = useMutation<any>(REVERT_ORDER_STAGE);

    useEffect(() => {
        if (!order_serial || called) return;
        getchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order_serial, called])

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

    const handleRevertConfirm = async () => {
        if (!revertReason.trim()) {
            message.error('Please provide a reason for reverting');
            return;
        }

        try {
            const result = await revertOrderStage({
                variables: {
                    input: {
                        _id_order: data.order._id,
                        target_stage: revertTargetStage,
                        reason: revertReason,
                        notes: revertNotes || undefined
                    }
                }
            }).then(r => checkApolloRequestErrors({
                results: r,
                allowEmpty: false,
                parseReturn: (rr: { data?: { revertOrderStage?: unknown } }) => rr?.data?.revertOrderStage
            }))
            .catch(catchApolloError);

            if (result.error) {
                message.error(result.error.details || result.error.message || 'Failed to revert order');
                return;
            }

            if (result.success) {
                message.success(`Order reverted to ${revertTargetStage} successfully`);
                setIsRevertModalVisible(false);
                setRevertReason('');
                setRevertNotes('');
                // Refresh order data
                getchData();
            }
        } catch (err) {
            message.error('An error occurred while reverting the order');
            console.error(err);
        }
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

    if (loading) return <Loader loading={true} />
    if (!data?.order) return <Alert title="Error" description="Order not found!" type="error" showIcon />
    if (error) return <Alert title="Error" description={error} showIcon type="error" />

    const order = data.order;
    const originalOrder = order.original_order;
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
        return `${settings?.currency || '$'} ${(safeAmount / 100).toFixed(2)}`;
    };

    // Order items table columns
    const itemColumns: ColumnsType<any> = [
        {
            title: '#',
            width: 50,
            render: (_: unknown, __: unknown, index: number) => index + 1,
        },
        {
            title: 'Product',
            dataIndex: 'title',
            key: 'title',
            render: (title: string, record: any) => (
                <div>
                    <div><strong>{title}</strong></div>
                    {record.barcode && <Text type="secondary" style={{ fontSize: '12px' }}>Barcode: {record.barcode}</Text>}
                    {record.categories && record.categories.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                            {record.categories.map((cat: { _id: string; title: string }, idx: number) => (
                                <Tag key={idx} color="blue" style={{ fontSize: '11px' }}>{cat?.title || ''}</Tag>
                            ))}
                        </div>
                    )}
                    {record.attributes && record.attributes.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                            {record.attributes.map((attr: { name: string; value: string }, idx: number) => (
                                <Tag key={idx} style={{ fontSize: '11px' }}>{attr?.name || ''}: {attr?.value || ''}</Tag>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 100,
            align: 'right',
            render: (price: number, record: any) => (
                <div>
                    {record.price_was && record.price_was > price && (
                        <div>
                            <Text delete type="secondary" style={{ fontSize: '12px' }}>{formatCurrency(record.price_was)}</Text>
                        </div>
                    )}
                    <div><strong>{formatCurrency(price)}</strong></div>
                </div>
            ),
        },
        {
            title: 'Qty',
            dataIndex: 'qty',
            key: 'qty',
            width: 70,
            align: 'center',
            render: (qty: number) => <strong>{qty}</strong>,
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            width: 100,
            align: 'right',
            render: (subtotal: number) => <strong>{formatCurrency(subtotal)}</strong>,
        },
        {
            title: 'Tax',
            dataIndex: 'tax_amount',
            key: 'tax_amount',
            width: 100,
            align: 'right',
            render: (tax_amount: number, record: any) => (
                <div>
                    <div>{formatCurrency(tax_amount)}</div>
                    {record.tax && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {record.tax.type} @ {record.tax.rate}%
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Discount',
            dataIndex: 'discount_amount',
            key: 'discount_amount',
            width: 100,
            align: 'right',
            render: (discount_amount: number, record: any) => (
                <div>
                    {discount_amount > 0 ? (
                        <>
                            <div style={{ color: '#52c41a' }}>-{formatCurrency(discount_amount)}</div>
                            {record.vouchers && record.vouchers.length > 0 && (
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    {record.vouchers.map((v: { title: string }) => v.title).join(', ')}
                                </Text>
                            )}
                        </>
                    ) : (
                        <Text type="secondary">-</Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            width: 120,
            align: 'right',
            render: (total: number) => <strong style={{ fontSize: '15px' }}>{formatCurrency(total)}</strong>,
        },
    ];

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


    return (<div>
        <PageHeader title={<>Order Details</>} sub={<div>Order #{order_serial}</div>}>
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
                <Button icon={<Icon icon="arrow-left" />} onClick={() => router.push(`${adminRoot}/store/${store_id}/orders`)}>Back to Orders</Button>
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
                        <Table
                            columns={itemColumns}
                            dataSource={originalOrder?.items || []}
                            rowKey="_id_product"
                            pagination={false}
                            size="small"
                            bordered
                            summary={(pageData) => {
                                // let totalBorrow = 0;
                                // let totalRepayment = 0;
                                // pageData.forEach(({ borrow, repayment }) => {
                                //     totalBorrow += borrow;
                                //     totalRepayment += repayment;
                                // });

                                return (<>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={2} align="right">You Saved</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text style={{ color: '#52c41a' }}>-{formatCurrency(totals.saved)}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} align="center">{totals?.totalQuantity || 0}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} align="right">{formatCurrency(totals?.subtotal || 0)}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={4} align="right">{totals?.taxRate || 0}%</Table.Summary.Cell>
                                        <Table.Summary.Cell index={5} align="right">{totals?.discountTotal > 0 && (<>
                                            <Text style={{ color: '#52c41a' }}>-{formatCurrency(totals.discountTotal)}</Text>
                                        </>)}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={6} align="right">
                                            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>{formatCurrency(totals?.grandTotal || 0)}</Title>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                    {/* <Table.Summary.Row>
                                        <Table.Summary.Cell index={0}>Balance</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={2}><Text type="danger">totalBorrow - totalRepayment</Text></Table.Summary.Cell>
                                    </Table.Summary.Row> */}
                                </>);
                            }}
                        />
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


            {/* Debug Information */}
            <Divider />
            <DevBlock obj={order} />

        </Page>

        {/* Revert Order Modal */}
        <Modal
            title="Revert Order Stage"
            open={isRevertModalVisible}
            onOk={handleRevertConfirm}
            onCancel={() => {
                setIsRevertModalVisible(false);
                setRevertReason('');
                setRevertNotes('');
            }}
            confirmLoading={reverting}
            okText="Confirm Revert"
            okButtonProps={{ danger: true }}
            width={600}
        >
            <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <Alert
                    title="Warning"
                    description={
                        <div>
                            <p>You are about to revert this order to <strong>{revertTargetStage}</strong>.</p>
                            <p>This action will:</p>
                            <ul style={{ marginLeft: 20, marginBottom: 0 }}>
                                {revertTargetStage === 'pending' && (
                                    <>
                                        <li>Reset the order to its original state</li>
                                        <li>Clear all processing stages and data</li>
                                        <li>Release any locks and assigned resources</li>
                                        <li>Set order status back to NEW</li>
                                    </>
                                )}
                                {revertTargetStage === 'picking-complete' && (
                                    <>
                                        <li>Restore order data from after picking was completed</li>
                                        <li>Clear till verification and delivery stages</li>
                                        <li>Release any locks (order will need to be re-verified at till)</li>
                                    </>
                                )}
                                {revertTargetStage === 'ready-to-dispatch' && (
                                    <>
                                        <li>Restore order data from after till verification</li>
                                        <li>Clear delivery stage</li>
                                        <li>Release delivery-related locks</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    }
                    type="warning"
                    showIcon
                />

                <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Reason for Reverting <span style={{ color: 'red' }}>*</span>
                    </label>
                    <Input
                        placeholder="Enter reason for reverting (required)"
                        value={revertReason}
                        onChange={(e) => setRevertReason(e.target.value)}
                        maxLength={200}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Additional Notes (Optional)
                    </label>
                    <TextArea
                        placeholder="Enter any additional notes or comments"
                        value={revertNotes}
                        onChange={(e) => setRevertNotes(e.target.value)}
                        rows={4}
                        maxLength={500}
                    />
                </div>
            </Space>
        </Modal>
    </div>)

}

export default OrderPreview;
