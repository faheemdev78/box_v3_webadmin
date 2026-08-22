'use client';

import { useState, type ReactNode } from "react";
import { useMutation } from '@apollo/client/react';
import { adminRoot, defaultDateTimeFormat } from "@/configs";
import { Alert, message, Modal, Space, Tag, Tooltip, Typography } from "antd";
import { UserOutlined, ShoppingOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { catchApolloError, checkApolloRequestErrors } from "@/lib/utill_apollo";
import { Button, Icon, usePageProps, PopMenu, OrderItemsPreviewButton, OrderFilters } from '@/components';
import { Page } from "@/template";
import Link from "next/link";
import { useAppSelector } from "@/rStore/hooks";
import type { RootState } from '@/rStore';
import { getSettings } from "@/rStore/slices/systemSlice";
import { utcToDate } from "@/lib/utill";
import { ResetButton, RevertOrderModal } from "./components";
import { getSession } from "@/rStore/slices/sessionSlice";
import security from '@/lib/security';
import { usePrintTillReceipt } from "@/hooks/useTillVerification";

import RESET_ORDER from '@/graphql/order/resetOrderToZero.graphql'
import CANCEL_OR_DECLINE_ORDER from '@/graphql/order/cancelOrDeclineOrder.graphql'

const { Text } = Typography;

function OrdersListPage(props:any) {
    const session = useAppSelector((state: RootState) => state.session);
    const canView = security.verifyRole('106.0', session.user.permissions); // Manage Product Fields
    const canCancelOrders = security.verifyRole('106.1', session.user.permissions);

    const { store } = usePageProps() as unknown as { store: any }
    const settings = useAppSelector(getSettings);
    const userSession = useAppSelector(getSession);
    // const router = useRouter()
    
    const [busy, setBusy] = useState(false)
    const [reloadToken, setReloadToken] = useState(0)
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptText, setReceiptText] = useState('');
    const [receiptOrderSerial, setReceiptOrderSerial] = useState('');
    const [revertModal, setRevertModal] = useState<{ open: boolean; order: any; targetStage: string }>({
        open: false,
        order: null,
        targetStage: '',
    });
    // const [savedViews, setSavedViews] = useState<ViewConfig[]>(INITIAL_ORDER_VIEWS)
    // const [activeView, setActiveView] = useState<ViewConfig | null>(null)

    const [resetOrder, resetOrder_results] = useMutation<any>(RESET_ORDER);
    const [cancelOrDeclineOrderMutation, { loading: cancellingOrDeclining }] = useMutation<any>(CANCEL_OR_DECLINE_ORDER);
    const { printReceipt } = usePrintTillReceipt();

    if (!canView) return <Alert title="Access Denied!" type="error" showIcon />

    const fetchData = () => setReloadToken((token) => token + 1);

    // useEffect(() => {
    //     if (called || loading) return
    //     // fetchData({})
    // }, [called, loading])

    // Helper function to convert view filter groups to GraphQL filter format
    // const convertViewToGraphQLFilter = (view: ViewConfig) => {
    //     // TODO: Implement proper conversion from view.filterGroups to GraphQL filter format
    //     // For now, return a basic filter structure
    //     const filter: any = {};

    //     view.filterGroups.forEach(group => {
    //         group.conditions.forEach(condition => {
    //             // Simple field mapping - in production, you'd want more sophisticated conversion
    //             if (condition.value !== null && condition.value !== undefined) {
    //                 filter[condition.field] = condition.value;
    //             }
    //         });
    //     });

    //     return filter;
    // };

    // Create view configuration for current user
    // const viewConfig = createOrderViewConfig({
    //     id: 'admin_user', // In production, get from auth context
    //     role: 'admin',
    //     teamId: store._id
    // });

    // View callbacks
    // const viewCallbacks = {
    //     onApplyView: (view: ViewConfig) => {
    //         setActiveView(view);
    //         const graphQLFilter = convertViewToGraphQLFilter(view);
    //         fetchData({ filter: graphQLFilter, pagination: {} });
    //         message.info(`Applied view: ${view.name}`);
    //     },
    //     onSaveView: async (view: ViewConfig) => {
    //         // TODO: Save to database via GraphQL mutation
    //         setSavedViews([...savedViews, view]);
    //         console.log('Saving view:', view);
    //     },
    //     onUpdateView: async (view: ViewConfig) => {
    //         // TODO: Update in database via GraphQL mutation
    //         setSavedViews(savedViews.map(v => v.id === view.id ? view : v));
    //         console.log('Updating view:', view);
    //     },
    //     onDeleteView: async (viewId: string) => {
    //         // TODO: Delete from database via GraphQL mutation
    //         setSavedViews(savedViews.filter(v => v.id !== viewId));
    //         console.log('Deleting view:', viewId);
    //     }
    // };

    const handleResetOrder = async (order:any) => {
        setBusy(true)
        const processedResult = await resetOrder({
            variables: { _id_order: order._id }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr:any) => rr?.data?.resetOrderToZero }))
            .catch(catchApolloError)
        setBusy(false)

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
            fetchData({});
        }
    };

    const handleRevertOrder = (order: any, targetStage: string) => {
        setRevertModal({ open: true, order, targetStage });
    };

    const canRevertTo = (order: any, targetStage: string) => {
        if (!order?.current_stage) return false;

        const currentStage = order.current_stage;
        const stageOrder = ['pending', 'picking', 'picking-complete', 'till_verification', 'ready-to-dispatch', 'delivering', 'delivered', 'completed'];

        const currentIndex = stageOrder.indexOf(currentStage);
        const targetIndex = stageOrder.indexOf(targetStage);

        // Can only revert backwards
        return targetIndex < currentIndex && !['cancelled', 'delivered', 'completed'].includes(currentStage);
    };

    const canPrintTillReceipt = (order: any) => {
        const normalize = (value: any) => String(value || '').toLowerCase().replace(/[_\s]+/g, '-');
        const currentStage = normalize(order?.current_stage);
        const orderStatus = normalize(order?.status?.order);

        // "dispatched" orders are represented as "delivering" in current stage.
        return ['ready-to-dispatch', 'dispatched', 'delivering'].includes(currentStage)
            || ['ready-to-dispatch', 'dispatched'].includes(orderStatus);
    };

    const canMarkOrderAsTerminal = (order: any) => {
        const normalize = (value: any) => String(value || '').toLowerCase().replace(/[_\s]+/g, '-');
        const currentStage = normalize(order?.current_stage);
        const orderStatus = normalize(order?.status?.order);
        const terminalStates = ['cancelled', 'declined', 'delivered', 'completed'];

        return !terminalStates.includes(currentStage) && !terminalStates.includes(orderStatus);
    };

    const handleCancelOrDeclineOrder = async (order: any, action: 'cancelled' | 'declined') => {
        const actionLabel = action === 'cancelled' ? 'Cancelled' : 'Declined';
        const confirmed = window.confirm(`Are you sure you want to mark order ${order.serial} as ${actionLabel}?\n\nThis will release all assigned baskets.`);
        if (!confirmed) return;

        const reason = window.prompt(`Please provide a reason for marking as ${actionLabel}:`);
        if (!reason || !reason.trim()) {
            message.warning(`${actionLabel} action requires a reason`);
            return;
        }

        setBusy(true);
        const processedResult = await cancelOrDeclineOrderMutation({
            variables: {
                input: {
                    _id_order: order._id,
                    action,
                    reason: reason.trim(),
                    notes: ''
                }
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.cancelOrDeclineOrder }))
            .catch(catchApolloError);
        setBusy(false);

        if (processedResult?.error) {
            const errorDetails = processedResult?.error?.details || processedResult?.error?.message || 'Unknown error';
            message.error(`Failed to mark order as ${actionLabel}: ${errorDetails}`);
            return;
        }

        if (processedResult?.success) {
            const releasedCount = processedResult?.data?.baskets_released || 0;
            message.success(`Order ${order.serial} marked as ${actionLabel}. Released ${releasedCount} basket(s).`);
            fetchData({});
        }
    };

    const handlePrintTillReceipt = async (order: any) => {
        setBusy(true);
        try {
            const result = await printReceipt(order._id);
            if (!result?.receiptText) {
                message.error('Receipt content is not available');
                return;
            }

            setReceiptText(result.receiptText);
            setReceiptOrderSerial(order?.serial || '');
            setShowReceiptModal(true);
        } catch (error: any) {
            message.error(error?.message || 'Failed to print receipt');
        } finally {
            setBusy(false);
        }
    };

    const escapeHtml = (text: string) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const handlePrintFromModal = () => {
        if (!receiptText) {
            message.error('Receipt content is not available');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=420,height=800');
        if (!printWindow) {
            message.error('Unable to open print window');
            return;
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt ${receiptOrderSerial || ''}</title>
              <style>
                body {
                  margin: 0;
                  padding: 12px;
                  background: #fff;
                  font-family: monospace;
                  white-space: pre-wrap;
                }
              </style>
            </head>
            <body>${escapeHtml(receiptText)}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const renderActions = (_: any, record: any) => {
        let returnArr: ReactNode[] = []

        returnArr.push(<OrderItemsPreviewButton key="items-preview" order={record} storeId={store._id} />)

        if (record.locked_by){
            if (record.locked_by === userSession.user._id) returnArr.push(<span key="lock-me" style={{ color: "green" }}><Tooltip title="Locked by you"><Icon icon="lock" /></Tooltip></span>)
            else returnArr.push(<span key="lock-other" style={{ color: "red" }}><Tooltip title="Locked by someone else"><Icon icon="lock" /></Tooltip></span>)
        }
        // if (record.current_stage !== 'pending') returnArr.push(<ResetButton size="small" handleResetOrder={() => handleResetOrder(record)} />)

        // Set popup Menu
        let popArray: any[] = []
        if (record.current_stage !== 'pending') popArray.push({ onClick: () => handleResetOrder(record), label: "Reset to New", confirm: true })
        if (canRevertTo(record, 'pending')) popArray.push({ onClick: () => handleRevertOrder(record, 'pending'), label: "To Pending" })
        if (canRevertTo(record, 'picking-complete')) popArray.push({ onClick: () => handleRevertOrder(record, 'picking-complete'), label: "To Picking Complete" })
        if (canRevertTo(record, 'ready-to-dispatch')) popArray.push({ onClick: () => handleRevertOrder(record, 'ready-to-dispatch'), label: "To Ready to Dispatch" })
        if (canCancelOrders && canMarkOrderAsTerminal(record)) popArray.push({ onClick: () => handleCancelOrDeclineOrder(record, 'cancelled'), label: "To Cancelled", confirm: true })
        if (canCancelOrders && canMarkOrderAsTerminal(record)) popArray.push({ onClick: () => handleCancelOrDeclineOrder(record, 'declined'), label: "To Declined", confirm: true })
        if (canPrintTillReceipt(record)) popArray.push({ onClick: () => handlePrintTillReceipt(record), label: "Print Receipt" })
        if (popArray.length) returnArr.push(<PopMenu key="menu" orientation="vertical" placement="left" items={popArray} ></PopMenu>);

        return (<Space size="small" wrap style={{ width: '100%' }}>{returnArr}</Space>);
    }
    

/*
    const _columns = [
        { title: 'Serial', _dataIndex: 'serial', key: 'serial', align: 'left',
            render: (__: any, { serial, current_stage, customer }: any) => (<Link href={`${adminRoot}/store/${store._id}/orders/preview/${serial}`}>{serial}</Link>)
        },
        { title: 'Customer', dataIndex: 'customer', key: 'customer',
            render: (customer: any) => (<Space>
                <UserOutlined />
                <Text>{customer?.name || 'N/A'}</Text>
            </Space>),
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
        { title: 'Order', dataIndex: 'order', key: 'order', width: 150, align: 'left',
            render: (____: any, rec: any) => {
                let odr = rec.current_order || rec.original_order;
                return (<div>
                    <div><ShoppingOutlined /> {odr?.totals?.totalQuantity} items</div>
                    <div><b>{settings.currency}</b> {odr?.totals?.grandTotal}</div>
                </div>)
            }
        },
        { title: 'Slot', dataIndex: 'delivery_slot', key: 'delivery_slot', width: 120, align: 'left',
            render: (delivery_slot: any, rec: any) => {
                return (<div>
                    <div>{String(delivery_slot.start_time).padStart(4, '0')} ~ {String(delivery_slot.end_time).padStart(4, '0')}</div>
                    <div>{String(delivery_slot.day).toUpperCase()}</div>
                </div>)
            }
        },
        { title: 'Status', dataIndex: ['status', 'order'], key: 'status', width: 220, align: 'left',
            render: (__: any, { current_stage, status, locked_by, lock_type, is_locked_by_me, handledBy }: any) => (<div>
                <div><b>Stage:</b> {current_stage}</div>
                <div><b>Status:</b> {status.order}</div>
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
            </Space>)
        },
        { title: 'Updated', dataIndex: ['updatedAt'], key: 'updatedAt', width: 115, align: 'left',
            render: (updatedAt: string, rec: any) => (<div>{moment(updatedAt).format(defaultDateTimeFormat)}</div>)
        },

        { title: 'Actions', key: 'actions', width: 100, align: 'center',
            render: (_: any, record: any) => {
                let hasActions = columns.find(o => o.key == 'actions')
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
                                onClick={() => router.push(`${adminRoot}/store/${record.store._id}/till-verification/${record.barcode}/verify`)}
                                icon={<PlayCircleOutlined />}>{record.is_locked_by_me ? 'Resume' : 'Start'}</Button>
                        </>}
                    </>}

                    {(record.locked_by && hasActions?.options?.till_verification) && <>
                        <Link href={`${adminRoot}/store/${record.store._id}/till-verification/${record.barcode}/verify`}><Space size={2}>
                            <PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}
                        </Space></Link>
                    </>}

                </Space>)
            },
        },
    ]
*/


    return (<>
        <Page>
            <OrderFilters
                entityType="orders"
                storeId={store._id}
                contextFilter={{ "store._id": store._id }}
                reloadToken={reloadToken}
                customColumns={{
                    serial: {
                        width: 180,
                        ellipsis: true,
                        // render: (__: any, { serial, current_stage, customer }: any) => (<Link href={`${adminRoot}/store/${store._id}/orders/preview/${serial}`}>{serial}</Link>)
                        render: (__: any, { current_order, serial, current_stage, customer }: any) => {
                            return (<>
                                <Link href={`${adminRoot}/store/${store._id}/orders/preview/${serial}`}>{serial}</Link>
                                {(current_order && current_order.baskets) && <div>
                                    {current_order?.baskets?.map((basket: any, i: number) => (<Tag styles={{
                                        root: {
                                            fontSize:"10px"
                                        }
                                    }} key={i}>{basket.title}</Tag>))}
                                </div>}
                                {/* <div><b>Customer:</b> {customer.name}</div> */}
                            </>)
                        }
                    },
                    customer: {
                        render: (customer: any, rec: any) => (<Space>
                            <UserOutlined />
                            <Text>{customer || 'N/A'}</Text>
                        </Space>)
                    },
                    picker: {
                        render: (picking: any, rec: any) => {
                            return (<Space>
                                <UserOutlined style={{ color: '#52c41a' }} />
                                <Text>{picking?.handled_by?.name || 'N/A'}</Text>
                            </Space>)
                        }
                    },
                    store: {
                        render: (_: any, rec: any) => (<div>
                            <div>{rec?.store?.title}</div>
                            <div><b>ZONE:</b> {rec?.zone?.title}</div>
                        </div>)
                    },
                    current_order: {
                        width: 130,
                        render: (_: any, rec: any) => (<div>
                            <div><ShoppingOutlined /> {rec?.current_order?.totals?.totalQuantity} items</div>
                            <div><b>{settings.currency}</b> {rec?.current_order?.totals?.grandTotal}</div>
                        </div>)
                    },
                    delivery_slot: {
                        width: 130, 
                        render: (delivery_slot: any, rec: any) => (<div>
                            <div>{String(delivery_slot.start_time).padStart(4, '0')} ~ {String(delivery_slot.end_time).padStart(4, '0')}</div>
                            <div>{String(delivery_slot.day).toUpperCase()}</div>
                        </div>)
                    },
                    createdAt: { width: 110,
                        render: (createdAt: string) => (<Space orientation="vertical" size={0}>
                            <Tooltip title={utcToDate(createdAt).format(defaultDateTimeFormat)}>
                                <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {utcToDate(createdAt).format('HH:mm A')}</Text>
                                <div><Text type="secondary" style={{ fontSize: 11 }}>{utcToDate(createdAt).fromNow()}</Text></div>
                            </Tooltip>
                        </Space>)
                    },
                    "status.order": {
                        width: 130,
                        // render: (status: string) => (status)
                    },
                    current_stage: {
                        width: 130,
                        // render: (status: string) => (status)
                    },
                    // "status": {
                    //     width: 220, align: 'left', title: "Status",
                    //     render: (__: any, { current_stage, status, locked_by, lock_type, is_locked_by_me, handledBy }: any) => (<div>
                    //         <div><b className='text-gray-400'>Stage:</b> {current_stage}</div>
                    //         <div><b className='text-gray-400'>Status:</b> {status.order}</div>
                    //         {locked_by && <>
                    //             <Space>
                    //                 <div><Icon icon="lock" /> {lock_type}</div>
                    //                 {/* <UserOutlined style={{ color: '#52c41a' }} /> */}
                    //                 {is_locked_by_me && <Tag color="orange">Locked by you</Tag>}
                    //             </Space>
                    //         </>}
                    //     </div>)
                    // },

                    // Example of unconfigured column - this will be added automatically
                    // even if it's not in the view configuration (will appear at the end)
                    // Note: If "status" is configured but hidden in view, it stays hidden
                    // But "actions" is not in config, so it will always appear
                    // "current_order.baskets": {
                    //     title: 'Baskets', width: 120,
                    //     render: (_: any, rec: any) => {
                    //         const baskets = rec?.current_order?.baskets || [];
                    //         if (!baskets.length) return null;
                    //         return baskets.map((basket, i) => (<Tag key={i}>{basket.title}</Tag>))
                    //     },
                    // },
                    actions: {
                        title: 'Actions', width: 120, fixed: 'right',
                        render: renderActions,
                    },

                }}
            />
            {/* <ViewFilter
                config={viewConfig}
                views={savedViews}
                callbacks={viewCallbacks}
            /> */}

            {/* <div style={{ marginTop: 16 }}>
                <Card
                    title={<Space>
                        <Title level={3} style={{ margin: 0 }}>Orders</Title>
                        {!loading && <Tag color="green">{state?.pagination?.total || 0} orders found</Tag>}
                    </Space>}
                    extra={<Button onClick={() => fetchData({})} loading={loading}>Refresh</Button>}
                    styles={{ body: { padding: 0 } }}
                >
                    {fatelError && <Alert title="Error" description={fatelError} type="error" showIcon />}

                    <OrderTable
                        busy={false}
                        columns={['serial', 'customer', 'picker', 'order', 'delivery_slot', 'status', 'createdAt', {
                            key: 'actions',
                            options: { reset: true, till_verification: false }
                        }]}
                        dataSource={state.dataSource}
                        dataSource={state.dataSource || []}
                        pagination={state.pagination}
                        scroll={{ x: 1200 }}
                    />
                </Card>
            </div> */}

            <Modal
                open={showReceiptModal}
                onCancel={() => setShowReceiptModal(false)}
                title={`Receipt${receiptOrderSerial ? ` - ${receiptOrderSerial}` : ''}`}
                width={420}
                footer={[
                    <Button key="close" onClick={() => setShowReceiptModal(false)}>Close</Button>,
                    <Button key="print" type="primary" onClick={handlePrintFromModal}>Print</Button>,
                ]}
            >
                <pre style={{
                    margin: 0,
                    maxHeight: 500,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: 12
                }}>
                    {receiptText}
                </pre>
            </Modal>

            <RevertOrderModal
                open={revertModal.open}
                order={revertModal.order}
                targetStage={revertModal.targetStage}
                storeId={store._id}
                onClose={() => setRevertModal({ open: false, order: null, targetStage: '' })}
                onSuccess={() => fetchData({})}
            />

        </Page>

    </>)
}

export default OrdersListPage;
