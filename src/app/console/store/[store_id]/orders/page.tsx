'use client';

import { useEffect, useState } from "react";
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { adminRoot, defaultPageSize, defaultPagination } from "@_/configs";
import { Alert, Card, message, Popover, Row, Space, Tag, Tooltip, Typography } from "antd";
import { UserOutlined, ShoppingOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { catchApolloError, checkApolloRequestErrors } from "@_/lib/utill_apollo";
// import OrdersList, { defaultProps } from "@_/modules/orders/ordersList";
import { Button, DevBlock, Icon, OrderTable, usePageProps } from '@_/components';
// import { ViewFilter, ViewConfig } from '@_/components/ViewFilter';
import { Page } from "@_/template";
// import { createOrderViewConfig, INITIAL_ORDER_VIEWS } from './components/orderViewConfig';
import { DynamicViewFilter } from "@_/app/console/view_filter/components/DynamicViewFilter";
import Link from "next/link";
import { useAppSelector } from "@_/rStore/hooks";
import { getSettings } from "@_/rStore/slices/systemSlice";
import { utcToDate } from "@_/lib/utill";
import { ResetButton } from "./components";
// import { useRouter } from "next/navigation";
import { getSession } from "@_/rStore/slices/sessionSlice";

import LIST_DATA from '@_/graphql/order/ordersQuery.graphql'
import RESET_ORDER from '@_/graphql/order/resetOrderToZero.graphql'
import REVERT_ORDER_STAGE from '@_/graphql/order/revertOrderStage.graphql'

const { Title, Text } = Typography;

const defaultFilter = {}; // { status: 'online' }

function OrdersListPage(props:any) {
    const { store } = usePageProps() as unknown as { store: any }
    const settings = useAppSelector(getSettings);
    const userSession = useAppSelector(getSession);
    // const router = useRouter()
    
    const [busy, setBusy] = useState(false)
    const [fatelError, setFatelError] = useState(false)
    // const [savedViews, setSavedViews] = useState<ViewConfig[]>(INITIAL_ORDER_VIEWS)
    // const [activeView, setActiveView] = useState<ViewConfig | null>(null)

    const [state, setState] = useState({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
    })

    const [ordersQuery, { called, loading }] = useLazyQuery(LIST_DATA, { fetchPolicy: 'network-only' });
    const [resetOrder, resetOrder_results] = useMutation(RESET_ORDER);
    const [revertOrderStage, { loading: reverting }] = useMutation(REVERT_ORDER_STAGE);

    const fetchData = async ({ filter = {}, pagination = {} }: { filter?: any; pagination?: { pageSize?: number; current?: number } } = {}) => {
        setFatelError(false);

        const variables = {
            limit: pagination?.pageSize || state.pagination.pageSize,
            page: pagination?.current || state.pagination.current,
            filter: filter || state.filter || {},
            others: (state as any).others || {},
            _id_store: store._id,
        }

        // setBusy(true)
        const resutls = await ordersQuery({ 
            variables: {
                ...variables,
                filter: JSON.stringify(variables.filter),
                others: JSON.stringify(variables.others || {})
            }
         })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.ordersQuery }))
            .catch(catchApolloError)
        // setBusy(false)

        if (resutls && resutls.error) {
            setFatelError(resutls.error.message)
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

    // useEffect(() => {
    //     if (called || loading) return
    //     // fetchData({})
    // // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleRevertOrder = async (order: any, targetStage: string) => {
        const stageName = targetStage === 'pending' ? 'Pending' :
                         targetStage === 'picking-complete' ? 'Picking Complete' :
                         targetStage === 'ready-to-dispatch' ? 'Ready to Dispatch' : targetStage;

        const confirmed = window.confirm(`Are you sure you want to revert order ${order.serial} to ${stageName}?\n\nThis will restore the order to its state at that stage.`);
        if (!confirmed) return;

        const reason = window.prompt(`Please provide a reason for reverting to ${stageName}:`);
        if (!reason || !reason.trim()) {
            message.warning('Revert cancelled: Reason is required');
            return;
        }

        setBusy(true);
        const processedResult = await revertOrderStage({
            variables: {
                input: {
                    _id_order: order._id,
                    target_stage: targetStage,
                    reason: reason.trim(),
                    notes: ''
                }
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.revertOrderStage }))
            .catch(catchApolloError);
        setBusy(false);

        if (processedResult.error) {
            message.error(`Failed to revert order: ${processedResult.error.message}`);
            return;
        }

        if (processedResult.success) {
            message.success(`Order ${order.serial} has been reverted to ${stageName}`);
            fetchData({});
        }
    };

    const canRevertTo = (order: any, targetStage: string) => {
        if (!order?.current_stage) return false;

        const currentStage = order.current_stage;
        const stageOrder = ['pending', 'picking', 'picking-complete', 'till_verification', 'ready-to-dispatch', 'delivering', 'delivered', 'completed'];

        const currentIndex = stageOrder.indexOf(currentStage);
        const targetIndex = stageOrder.indexOf(targetStage);

        // Can only revert backwards
        return targetIndex < currentIndex && !['cancelled', 'completed'].includes(currentStage);
    };
    

/*
    const _columns = [
        { title: 'Serial', _dataIndex: 'serial', key: 'serial', align: 'left',
            render: (__: any, { serial, current_stage, customer }: any) => (<Link href={`${adminRoot}/orders/preview/${serial}`}>{serial}</Link>)
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
            render: (createdAt: string) => createdAt && (<Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {utcToDate(createdAt).format('HH:mm A')}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{utcToDate(createdAt).fromNow()}</Text>
            </Space>)
        },
        { title: 'Updated', dataIndex: ['updatedAt'], key: 'updatedAt', width: 115, align: 'left',
            render: (updatedAt: string, rec: any) => (<div>{moment(updatedAt).format(defaultDateTimeFormat)}</div>)
        },

        { title: 'Actions', key: 'actions', width: 100, align: 'center',
            render: (_: any, record: any) => {
                let hasActiosn = columns.find(o => o.key == 'actions')
                if (!hasActiosn) return null;

                return (<Space size="small">
                    {(hasActiosn?.options?.reset && record.current_stage !== 'pending') && (
                        <ResetButton size="small" handleResetOrder={() => handleResetOrder(record)} />
                    )}

                    {hasActiosn?.options?.till_verification && <>
                        {(record.locked_by && !record.is_locked_by_me) && <>
                            <Icon icon="lock" /> Locked by someone else
                        </>}

                        {((record.locked_by && record.is_locked_by_me) || !record.locked_by) && <>
                            <Button size="small" color="blue"
                                onClick={() => router.push(`${adminRoot}/store/${record.store._id}/till-verification/${record._id}/verify`)}
                                icon={<PlayCircleOutlined />}>{record.is_locked_by_me ? 'Resume' : 'Start'}</Button>
                        </>}
                    </>}

                    {(record.locked_by && hasActiosn?.options?.till_verification) && <>
                        <Link href={`${adminRoot}/store/${record.store._id}/till-verification/${record._id}/verify`}><Space size={2}>
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
            <DynamicViewFilter 
                entityType="orders"
                customColumns={{
                    serial: {
                        width: 180,
                        ellipsis: true,
                        render: (__: any, { serial, current_stage, customer }: any) => (<Link href={`${adminRoot}/orders/preview/${serial}`}>{serial}</Link>)
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
                    createdAt: {
                        width: 130,
                        render: (createdAt: string) => (<Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {utcToDate(createdAt).format('HH:mm A')}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>{utcToDate(createdAt).fromNow()}</Text>
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
                    // Example of unconfigured column - this will be added automatically
                    // even if it's not in the view configuration (will appear at the end)
                    // Note: If "status" is configured but hidden in view, it stays hidden
                    // But "actions" is not in config, so it will always appear
                    actions: {
                        title: 'Actions', width: 150, fixed: 'right',
                        render: (_: any, record: any) => {
                            return (<div>
                                {/* {(record.locked_by && !record.is_locked_by_me) && <div><Icon icon="lock" /> by someone else</div>} */}
                                {/* {(record.locked_by && record.locked_by === userSession.user._id) && <div><Tooltip title="Locked by someone else"><Icon icon="lock" /></Tooltip></div>} */}

                                <Space size="small" wrap style={{ width: '100%' }}>
                                    {record.locked_by && <span>
                                        {record.locked_by === userSession.user._id ? 
                                            <span style={{ color:"green" }}><Tooltip title="Locked by you"><Icon icon="lock" /></Tooltip></span> :
                                            <span style={{ color: "red" }}><Tooltip title="Locked by someone else"><Icon icon="lock" /></Tooltip></span>
                                        }
                                    </span>}
                                    
                                    {(record.current_stage !== 'pending') && (
                                        <ResetButton size="small" handleResetOrder={() => handleResetOrder(record)} />
                                    )}

                                    {/* {((record.locked_by && record.is_locked_by_me) || !record.locked_by) && <span>
                                        <Button size="small" color="blue"
                                            onClick={() => router.push(`${adminRoot}/store/${record.store._id}/till-verification/${record._id}/verify`)}
                                            icon={<PlayCircleOutlined />}>{record.is_locked_by_me ? 'Resume' : 'Start'}</Button>
                                    </span>} */}

                                    {/* {(record.locked_by) && <>
                                        <Link href={`${adminRoot}/store/${record.store._id}/till-verification/${record._id}/verify`}><Space size={2}>
                                            <PlayCircleOutlined /> {record.is_locked_by_me ? 'Resume' : 'Start'}
                                        </Space></Link>
                                    </>} */}

                                    {/* Revert Buttons */}
                                    <Popover 
                                        content={<div>
                                            <Space size="small" wrap direction="vertical" style={{ width:"100%" }}>
                                                {canRevertTo(record, 'pending') && (<Button size="small" danger block onClick={() => handleRevertOrder(record, 'pending')}>to Pending</Button>)}
                                                {canRevertTo(record, 'picking-complete') && (<Button block size="small" onClick={() => handleRevertOrder(record, 'picking-complete')}>to Picking Complete</Button>)}
                                                {canRevertTo(record, 'ready-to-dispatch') && (<Button block size="small" onClick={() => handleRevertOrder(record, 'ready-to-dispatch')}>to Ready to Dispatch</Button>)}
                                            </Space>
                                        </div>} 
                                        title="Title" trigger="click"><Button size="small">Undo</Button></Popover>

                                </Space>

                            </div>)

                        },
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
                    {fatelError && <Alert message={fatelError} type="error" showIcon />}

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

        </Page>

    </>)
}

export default OrdersListPage;
