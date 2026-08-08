'use client';

import { useEffect, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { useRouter } from 'next/navigation';
import { __error } from '@/lib/consoleHelper';
import { adminRoot } from "@/configs";
import { Card, message, Row, Col, Button, Divider, Typography, Tag, Space, Alert } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { catchApolloError, checkApolloRequestErrors } from "@/lib/utill_apollo";
import { DevBlock, usePageProps, ProductItemFlags } from '@/components';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';

import ORDER_DETAILS_QUERY from '@/graphql/order/orderDetails.graphql';
import VERIFY_ORDER_AT_TILL from '@/graphql/order/verifyOrderAtTill.graphql';
import REJECT_ORDER_AT_TILL from '@/graphql/order/rejectOrderAtTill.graphql';

const { Title, Text } = Typography;

function TillVerification({ serial }: { serial:string }) {
    const router = useRouter();
    const pageProps: any = usePageProps();
    const store = pageProps?.store;
    const settings = useAppSelector(getSettings);

    const [fatelError, set_fatelError] = useState<string | null>(null);
    const [order, setOrder] = useState<any>(null);
    const [busy, setBusy] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified, rejected

    const [getOrderDetails, { loading }] = useLazyQuery<any>(ORDER_DETAILS_QUERY, { fetchPolicy: "network-only" });
    const [verifyOrder] = useMutation<any>(VERIFY_ORDER_AT_TILL);
    const [rejectOrder] = useMutation<any>(REJECT_ORDER_AT_TILL);

    const fetchOrderDetails = async () => {
        setBusy(true);
        try {
            const result = await getOrderDetails({
                variables: {
                    filter: JSON.stringify({
                        serial,
                        'store._id': store?._id,
                        current_stage: "picking-complete",
                        'status.order': 'processing'
                    })
                }
            })
                .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.orderDetails }))
                .catch(catchApolloError);

            if (result?.error) {
                set_fatelError(result.error.message)
                // router.push(`${adminRoot}/store/${store._id}/orders-on-till`);
                return;
            }

            if (!result) return set_fatelError('Order not found!')

            setOrder(result);
        } catch (error) {
            message.error('Failed to load order details');
            console.error('Error fetching order:', error);
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        if (serial && store?._id) {
            fetchOrderDetails();
        }
        
    }, [serial, store]);

    const handleVerificationComplete = async (status: string) => {
        if (!order?._id) return;

        setBusy(true);
        try {
            let result;

            if (status === 'verified') {
                result = await verifyOrder({
                    variables: {
                        input: {
                            _id_order: order._id,
                            notes: `Order verified at till by ${store?.admin?.name || 'admin'}`
                        }
                    }
                })
                .then(r => checkApolloRequestErrors({
                    results: r,
                    allowEmpty: false,
                    parseReturn: (rr: any) => rr?.data?.verifyOrderAtTill
                }))
                .catch(catchApolloError);
            } else {
                result = await rejectOrder({
                    variables: {
                        input: {
                            _id_order: order._id,
                            reason: 'Order rejected during till verification',
                            notes: `Order rejected at till by ${store?.admin?.name || 'admin'}`
                        }
                    }
                })
                .then(r => checkApolloRequestErrors({
                    results: r,
                    allowEmpty: false,
                    parseReturn: (rr: any) => rr?.data?.rejectOrderAtTill
                }))
                .catch(catchApolloError);
            }

            if (result?.error) {
                message.error(result.error.message);
                return;
            }

            setVerificationStatus(status);
            message.success(result.success?.message || `Order ${status === 'verified' ? 'verified' : 'rejected'} successfully`);

            // Navigate back to till orders list after verification
            setTimeout(() => {
                router.push(`${adminRoot}/store/${store._id}/orders-on-till`);
            }, 1500);

        } catch (error) {
            message.error(`Failed to ${status === 'verified' ? 'verify' : 'reject'} order`);
            console.error('Error during verification:', error);
        } finally {
            setBusy(false);
        }
    };

    const renderOrderItems = () => {
        if (!order?.current_order?.items) return null;

        return (
            <Card title="Order Items" className="mb-4">
                {order.current_order.items.map((item: any, index: number) => (
                    <Row key={index} className="py-2 border-b last:border-b-0">
                        <Col span={12}>
                            <Text strong>{item.title}</Text>
                            <div style={{ marginTop: 4 }}>
                                <ProductItemFlags item={item} variant="icons" />
                            </div>
                            <br />
                            <Text type="secondary">{item.barcode}</Text>
                        </Col>
                        <Col span={4} className="text-center">
                            <Text>Qty: {item.qty}</Text>
                        </Col>
                        <Col span={4} className="text-center">
                            <Text>{settings.currency}{item.price}</Text>
                        </Col>
                        <Col span={4} className="text-right">
                            <Text strong>{settings.currency}{item.total}</Text>
                        </Col>
                    </Row>
                ))}
                <Divider />
                <Row className="py-2">
                    <Col span={16}>
                        <Text strong>Total Amount:</Text>
                    </Col>
                    <Col span={8} className="text-right">
                        <Text strong className="text-lg">{settings.currency}{order.current_order.totals?.grandTotal || 0}</Text>
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderBasketInfo = () => {
        if (!order?.current_order?.baskets?.length) return null;

        return (
            <Card title="Basket Information" className="mb-4">
                <Space wrap>
                    {order.current_order.baskets.map((basket: any, index: number) => (
                        <Tag key={index} color="blue">
                            {basket.barcode} - {basket.title}
                        </Tag>
                    ))}
                </Space>
            </Card>
        );
    };

    const renderVerificationActions = () => {
        if (verificationStatus !== 'pending') {
            return (
                <Alert
                    title={`Order ${verificationStatus === 'verified' ? 'Verified' : 'Rejected'}`}
                    description={`This order has been ${verificationStatus} and is being processed.`}
                    type={verificationStatus === 'verified' ? 'success' : 'error'}
                    showIcon
                    className="mb-4"
                />
            );
        }

        return (
            <Card title="Verification Actions" className="mb-4">
                <Space size="large" className="w-full justify-center">
                    <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleVerificationComplete('verified')}
                        loading={busy}
                        className="bg-green-500 hover:bg-green-600"
                    >
                        Verify Order
                    </Button>
                    <Button
                        danger
                        size="large"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleVerificationComplete('rejected')}
                        loading={busy}
                    >
                        Reject Order
                    </Button>
                </Space>
            </Card>
        );
    };

    if (loading || busy) {
        return (
            <Card>
                <div className="text-center py-8">
                    <Text>Loading order details...</Text>
                </div>
            </Card>
        );
    }

    if (!order || fatelError) {
        return (
            <Card>
                <div className="text-center py-8">
                    {fatelError ? 
                        <Alert title="Error" description={fatelError} type="error" showIcon /> :
                        <Alert title="Error" description={'Order not found or not available for verification'} type="error" showIcon />
                    }
                    {/* <Text type="secondary">Order not found or not available for verification</Text> */}
                    <br />
                    <Button type="link" onClick={() => router.push(`${adminRoot}/store/${store._id}/orders-on-till`)}>Back to Till Orders</Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="p-4">
            <Row className="mb-4">
                <Col span={24}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push(`${adminRoot}/store/${store._id}/orders-on-till`)}
                        className="mb-2"
                    >
                        Back to Till Orders
                    </Button>
                    <Title level={2}>Till Verification - Order #{order.serial}</Title>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={16}>
                    {renderOrderItems()}
                    {renderBasketInfo()}
                </Col>

                <Col span={8}>
                    <Card title="Order Information" className="mb-4">
                        <div className="space-y-2">
                            <div>
                                <Text type="secondary">Customer:</Text><br />
                                <Text strong>{order.customer?.name}</Text>
                            </div>
                            <Divider />
                            <div>
                                <Text type="secondary">Delivery Slot:</Text><br />
                                <Text>{new Date(order.delivery_slot?.start_date).toLocaleDateString()}</Text><br />
                                <Text>{order.delivery_slot?.start_time} - {order.delivery_slot?.end_time}</Text>
                            </div>
                            <Divider />
                            <div>
                                <Text type="secondary">Current Stage:</Text><br />
                                <Tag color="orange">{order.current_stage?.replace('_', ' ').toUpperCase()}</Tag>
                            </div>
                            <Divider />
                            <div>
                                <Text type="secondary">Picked By:</Text><br />
                                <Text>{order.processing_stages?.picking?.handled_by?.name || 'Unknown'}</Text>
                            </div>
                        </div>
                    </Card>

                    {renderVerificationActions()}
                </Col>
            </Row>

            <DevBlock obj={{ order }} />
        </div>
    );
}

export default TillVerification
