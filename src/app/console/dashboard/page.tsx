'use client'

import React, { useState } from 'react'
import { Card, Col, Row, Statistic, Table, Tag, List, Space, Select } from 'antd';
import {
    ShoppingCartOutlined,
    ShopOutlined,
    TeamOutlined,
    RiseOutlined,
    FallOutlined,
    TrophyOutlined,
    WarningOutlined,
    UserAddOutlined,
    CarOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';
import { useAppSelector } from '@_/rStore/hooks';
import { getSettings } from '@_/rStore/slices/systemSlice';


// Dummy Data for Application-Wide Dashboard
const DASHBOARD_DATA = {
    // Overall Stats
    overallStats: {
        totalRevenue: 458750.00,
        totalOrders: 5842,
        totalCustomers: 12847,
        totalStores: 8,
        activeStores: 7,
        avgOrderValue: 78.50
    },

    // Comparison with last period
    comparison: {
        revenue: 15.8,
        orders: 12.3,
        customers: 8.7,
        stores: 0
    },

    // Today's Performance
    todayStats: {
        revenue: 24580.00,
        orders: 312,
        newCustomers: 45,
        activeDrivers: 38
    },

    // Store Performance
    storePerformance: [
        {
            id: 1,
            name: 'Downtown Store',
            city: 'San Francisco',
            revenue: 125600.00,
            orders: 1642,
            customers: 3420,
            rating: 4.8,
            status: 'active',
            growth: 18.5
        },
        {
            id: 2,
            name: 'Marina District',
            city: 'San Francisco',
            revenue: 98400.00,
            orders: 1289,
            customers: 2815,
            rating: 4.7,
            status: 'active',
            growth: 12.3
        },
        {
            id: 3,
            name: 'Mission Bay',
            city: 'San Francisco',
            revenue: 76500.00,
            orders: 998,
            customers: 2145,
            rating: 4.6,
            status: 'active',
            growth: -3.2
        },
        {
            id: 4,
            name: 'Oakland Center',
            city: 'Oakland',
            revenue: 65200.00,
            orders: 845,
            customers: 1890,
            rating: 4.5,
            status: 'active',
            growth: 8.7
        },
        {
            id: 5,
            name: 'Berkeley Store',
            city: 'Berkeley',
            revenue: 54300.00,
            orders: 712,
            customers: 1620,
            rating: 4.4,
            status: 'active',
            growth: 5.2
        },
        {
            id: 6,
            name: 'Palo Alto',
            city: 'Palo Alto',
            revenue: 38750.00,
            orders: 356,
            customers: 957,
            rating: 4.3,
            status: 'inactive',
            growth: 0
        }
    ],

    // Revenue Trend (Last 30 days)
    revenueTrend: [
        { day: 1, revenue: 15420 },
        { day: 5, revenue: 16800 },
        { day: 10, revenue: 18200 },
        { day: 15, revenue: 19500 },
        { day: 20, revenue: 21800 },
        { day: 25, revenue: 23400 },
        { day: 30, revenue: 24580 }
    ],

    // Orders by Status (All Stores)
    ordersByStatus: {
        pending: 89,
        processing: 124,
        ready_for_pickup: 45,
        out_for_delivery: 78,
        delivered: 4234,
        cancelled: 56,
        declined: 38
    },

    // Top Products Across All Stores
    topProducts: [
        { id: 1, name: 'Organic Vegetables Bundle', sold: 2145, revenue: 64350.00, stores: 7 },
        { id: 2, name: 'Fresh Milk (1L)', sold: 3420, revenue: 20520.00, stores: 8 },
        { id: 3, name: 'Whole Wheat Bread', sold: 2890, revenue: 8670.00, stores: 8 },
        { id: 4, name: 'Free Range Eggs (12)', sold: 1967, revenue: 11802.00, stores: 7 },
        { id: 5, name: 'Cheese Variety Pack', sold: 1245, revenue: 18675.00, stores: 6 }
    ],

    // Customer Distribution
    customerStats: {
        total: 12847,
        new_this_month: 1456,
        active: 8920,
        inactive: 3927,
        premium: 2340,
        avg_lifetime_value: 567.80
    },

    // Driver Performance
    driverStats: {
        total: 58,
        active_today: 38,
        avg_deliveries: 12.4,
        avg_rating: 4.6,
        total_deliveries_today: 312
    },

    // Recent High-Value Orders
    recentHighValueOrders: [
        { id: 'ORD-5842', customer: 'Alice Johnson', store: 'Downtown', amount: 456.50, status: 'delivered' },
        { id: 'ORD-5841', customer: 'Bob Smith', store: 'Marina', amount: 389.99, status: 'out_for_delivery' },
        { id: 'ORD-5840', customer: 'Carol White', store: 'Mission Bay', amount: 345.00, status: 'processing' },
        { id: 'ORD-5839', customer: 'David Lee', store: 'Oakland', amount: 298.75, status: 'delivered' },
        { id: 'ORD-5838', customer: 'Emma Davis', store: 'Berkeley', amount: 276.50, status: 'delivered' }
    ],

    // Inventory Alerts (Across all stores)
    inventoryAlerts: [
        { product: 'Fresh Milk (1L)', affected_stores: 3, total_stock: 45, status: 'critical' },
        { product: 'Organic Tomatoes', affected_stores: 2, total_stock: 28, status: 'low' },
        { product: 'Whole Wheat Bread', affected_stores: 4, total_stock: 67, status: 'low' },
        { product: 'Free Range Eggs', affected_stores: 2, total_stock: 34, status: 'critical' }
    ],

    // Staff Overview
    staffStats: {
        total: 124,
        present_today: 98,
        on_leave: 8,
        avg_performance: 4.5,
        top_performer: { name: 'John Smith', store: 'Downtown', rating: 4.9 }
    }
};

function ConsoleHome() {
    const { currency } = useAppSelector(getSettings)

    const CurrencyIcon = ({ size = "25", style = {} }) => (<span style={{ 
        border: "2px solid green", borderRadius: "30px", 
        width: `${size}px`, height: `${size}px`, display: "inline-flex", alignItems: "center", justifyContent: "center", 
        lineHeight: 1, fontSize: "14px", 
        margin: "0", position: "relative", top: "-2px",
        ...style
    }}>{currency}</span>)

    const [timeRange, setTimeRange] = useState('30days');

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            delivered: 'success',
            out_for_delivery: 'processing',
            ready_for_pickup: 'cyan',
            processing: 'blue',
            pending: 'warning',
            cancelled: 'default',
            declined: 'error',
            active: 'success',
            inactive: 'default'
        };
        return colors[status] || 'default';
    };

    const storeColumns = [
        { title: 'Store Name', dataIndex: 'name', key: 'name',
            render: (text: string, record: any) => (
                <Space>
                    <ShopOutlined />
                    <a>{text}</a>
                    <Tag color={getStatusColor(record.status)}>{record.status.toUpperCase()}</Tag>
                </Space>
            )
        },
        { title: 'City', dataIndex: 'city', key: 'city',
            render: (text: string) => (<Space><EnvironmentOutlined /> {text}</Space>)
        },
        { title: 'Revenue', dataIndex: 'revenue', key: 'revenue',
            render: (amount: number) => `${currency}${amount.toLocaleString()}`,
            sorter: (a: any, b: any) => a.revenue - b.revenue
        },
        { title: 'Orders', dataIndex: 'orders', key: 'orders',
            sorter: (a: any, b: any) => a.orders - b.orders
        },
        { title: 'Customers', dataIndex: 'customers', key: 'customers',
            sorter: (a: any, b: any) => a.customers - b.customers
        },
        { title: 'Rating', dataIndex: 'rating', key: 'rating',
            render: (rating: number) => (<Space><TrophyOutlined style={{ color: '#faad14' }} /> {rating}/5.0</Space>),
            sorter: (a: any, b: any) => a.rating - b.rating
        },
        { title: 'Growth', dataIndex: 'growth', key: 'growth',
            render: (growth: number) => (
                <span style={{ color: growth > 0 ? '#3f8600' : '#cf1322' }}>
                    {growth > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(growth)}%
                </span>
            ),
            sorter: (a: any, b: any) => a.growth - b.growth
        }
    ];

    const topProductColumns = [
        {
            title: 'Product',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'Units Sold',
            dataIndex: 'sold',
            key: 'sold',
            sorter: (a: any, b: any) => a.sold - b.sold
        },
        {
            title: 'Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (revenue: number) => `${currency}${revenue.toLocaleString()}`,
            sorter: (a: any, b: any) => a.revenue - b.revenue
        },
        {
            title: 'Stores',
            dataIndex: 'stores',
            key: 'stores',
            render: (stores: number) => `${stores}/${DASHBOARD_DATA.overallStats.totalStores}`
        }
    ];

    const recentOrderColumns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (text: string) => <a>{text}</a>
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer'
        },
        {
            title: 'Store',
            dataIndex: 'store',
            key: 'store'
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `${currency}${amount.toFixed(2)}`
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={getStatusColor(status)}>{status.replace(/_/g, ' ').toUpperCase()}</Tag>
        }
    ];

    return (<>
        <PageHeader
            title="Dashboard"
            sub={<>Multi-Store Performance Overview</>}
        >
            <Select
                value={timeRange}
                onChange={setTimeRange}
                style={{ width: 150 }}
                options={[
                    { label: 'Last 7 Days', value: '7days' },
                    { label: 'Last 30 Days', value: '30days' },
                    { label: 'Last 90 Days', value: '90days' },
                    { label: 'This Year', value: 'year' }
                ]}
            />
        </PageHeader>

        <Page>

            <Row gutter={[16, 16]}>
                {/* Overall Performance Metrics */}
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Card>
                        <Statistic
                            title="Total Revenue"
                            value={DASHBOARD_DATA.overallStats.totalRevenue}
                            precision={2}
                            prefix={<CurrencyIcon />}
                            valueStyle={{ color: '#3f8600', fontSize: 24 }}
                            suffix={
                                <span style={{ fontSize: 12, color: '#3f8600' }}>
                                    <RiseOutlined /> {DASHBOARD_DATA.comparison.revenue}%
                                </span>
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Card>
                        <Statistic
                            title="Total Orders"
                            value={DASHBOARD_DATA.overallStats.totalOrders}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={{ fontSize: 24 }}
                            suffix={
                                <span style={{ fontSize: 12, color: '#3f8600' }}>
                                    <RiseOutlined /> {DASHBOARD_DATA.comparison.orders}%
                                </span>
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Card>
                        <Statistic
                            title="Total Customers"
                            value={DASHBOARD_DATA.overallStats.totalCustomers}
                            prefix={<TeamOutlined />}
                            valueStyle={{ fontSize: 24 }}
                            suffix={
                                <span style={{ fontSize: 12, color: '#3f8600' }}>
                                    <RiseOutlined /> {DASHBOARD_DATA.comparison.customers}%
                                </span>
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Card>
                        <Statistic
                            title="Active Stores"
                            value={DASHBOARD_DATA.overallStats.activeStores}
                            suffix={`/ ${DASHBOARD_DATA.overallStats.totalStores}`}
                            prefix={<ShopOutlined />}
                            valueStyle={{ fontSize: 24, color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Card>
                        <Statistic
                            title="Avg Order Value"
                            value={DASHBOARD_DATA.overallStats.avgOrderValue}
                            precision={2}
                            prefix={currency}
                            valueStyle={{ fontSize: 24 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Card>
                        <Statistic
                            title="Active Drivers"
                            value={DASHBOARD_DATA.driverStats.active_today}
                            suffix={`/ ${DASHBOARD_DATA.driverStats.total}`}
                            prefix={<CarOutlined />}
                            valueStyle={{ fontSize: 24, color: '#722ed1' }}
                        />
                    </Card>
                </Col>

                {/* Left Column */}
                <Col xs={24} lg={16}>
                    {/* Revenue Trend */}
                    <Card title="Revenue Trend (Last 30 Days)" style={{ marginBottom: 16 }}>
                        <div style={{ padding: '20px 0' }}>
                            <Row gutter={[8, 8]} align="bottom">
                                {DASHBOARD_DATA.revenueTrend.map((item, index) => (
                                    <Col key={index} flex="1" style={{ textAlign: 'center' }}>
                                        <div style={{ marginBottom: 8 }}>
                                            <div style={{
                                                height: `${(item.revenue / 300)}px`,
                                                backgroundColor: '#1890ff',
                                                borderRadius: '4px 4px 0 0',
                                                minHeight: '30px',
                                                marginBottom: 4
                                            }} />
                                            <div style={{ fontSize: 12, fontWeight: 'bold' }}>{currency}{(item.revenue / 1000).toFixed(1)}k</div>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#999' }}>Day {item.day}</div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </Card>

                    {/* Order Status Overview */}
                    <Card title="Order Status Overview (All Stores)" style={{ marginBottom: 16 }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={8} md={6}>
                                <Statistic
                                    title="Pending"
                                    value={DASHBOARD_DATA.ordersByStatus.pending}
                                    valueStyle={{ color: '#faad14' }}
                                />
                            </Col>
                            <Col xs={12} sm={8} md={6}>
                                <Statistic
                                    title="Processing"
                                    value={DASHBOARD_DATA.ordersByStatus.processing}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Col>
                            <Col xs={12} sm={8} md={6}>
                                <Statistic
                                    title="Out for Delivery"
                                    value={DASHBOARD_DATA.ordersByStatus.out_for_delivery}
                                    valueStyle={{ color: '#13c2c2' }}
                                />
                            </Col>
                            <Col xs={12} sm={8} md={6}>
                                <Statistic
                                    title="Delivered"
                                    value={DASHBOARD_DATA.ordersByStatus.delivered}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            <Col xs={12} sm={8} md={6}>
                                <Statistic
                                    title="Ready for Pickup"
                                    value={DASHBOARD_DATA.ordersByStatus.ready_for_pickup}
                                    valueStyle={{ color: '#722ed1' }}
                                />
                            </Col>
                            <Col xs={12} sm={8} md={6}>
                                <Statistic
                                    title="Cancelled"
                                    value={DASHBOARD_DATA.ordersByStatus.cancelled}
                                    valueStyle={{ color: '#8c8c8c' }}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* Store Performance Table */}
                    <Card title="Store Performance Comparison" style={{ marginBottom: 16 }} styles={{ body: { padding:0 } }}>
                        <Table
                            columns={storeColumns}
                            dataSource={DASHBOARD_DATA.storePerformance}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>

                    {/* Top Products */}
                    <Card title="Top Selling Products (All Stores)" style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
                        <Table
                            columns={topProductColumns}
                            dataSource={DASHBOARD_DATA.topProducts}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                {/* Right Column */}
                <Col xs={24} lg={8}>
                    {/* Today's Activity */}
                    <Card title="Today's Activity" style={{ marginBottom: 16 }}>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic
                                    title="Revenue"
                                    value={DASHBOARD_DATA.todayStats.revenue}
                                    precision={2}
                                    prefix={currency}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Orders"
                                    value={DASHBOARD_DATA.todayStats.orders}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="New Customers"
                                    value={DASHBOARD_DATA.todayStats.newCustomers}
                                    prefix={<UserAddOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Active Drivers"
                                    value={DASHBOARD_DATA.todayStats.activeDrivers}
                                    prefix={<CarOutlined />}
                                    valueStyle={{ color: '#722ed1' }}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* Customer Overview */}
                    <Card title="Customer Overview" style={{ marginBottom: 16 }}>
                        <Statistic
                            title="Total Customers"
                            value={DASHBOARD_DATA.customerStats.total}
                            prefix={<TeamOutlined />}
                            valueStyle={{ fontSize: 28 }}
                        />
                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                            <Col span={12}>
                                <Statistic
                                    title="New This Month"
                                    value={DASHBOARD_DATA.customerStats.new_this_month}
                                    valueStyle={{ color: '#1890ff', fontSize: 20 }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Active"
                                    value={DASHBOARD_DATA.customerStats.active}
                                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Premium"
                                    value={DASHBOARD_DATA.customerStats.premium}
                                    valueStyle={{ color: '#faad14', fontSize: 20 }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Inactive"
                                    value={DASHBOARD_DATA.customerStats.inactive}
                                    valueStyle={{ color: '#8c8c8c', fontSize: 20 }}
                                />
                            </Col>
                            <Col span={24}>
                                <Statistic
                                    title="Avg Lifetime Value"
                                    value={DASHBOARD_DATA.customerStats.avg_lifetime_value}
                                    precision={2}
                                    prefix={currency}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* Staff Overview */}
                    <Card title="Staff Overview" style={{ marginBottom: 16 }}>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic
                                    title="Total Staff"
                                    value={DASHBOARD_DATA.staffStats.total}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Present Today"
                                    value={DASHBOARD_DATA.staffStats.present_today}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="On Leave"
                                    value={DASHBOARD_DATA.staffStats.on_leave}
                                    valueStyle={{ color: '#faad14' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Avg Performance"
                                    value={DASHBOARD_DATA.staffStats.avg_performance}
                                    suffix="/5.0"
                                    prefix={<TrophyOutlined />}
                                />
                            </Col>
                            <Col span={24}>
                                <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
                                    <div style={{ fontSize: 12, color: '#666' }}>Top Performer</div>
                                    <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                                        {DASHBOARD_DATA.staffStats.top_performer.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#666' }}>
                                        {DASHBOARD_DATA.staffStats.top_performer.store} • Rating: {DASHBOARD_DATA.staffStats.top_performer.rating}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Inventory Alerts */}
                    <Card
                        title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> Inventory Alerts</Space>}
                        style={{ marginBottom: 16 }}
                        styles={{ body: { padding: 0 } }}
                    >
                        <List
                            size="small"
                            dataSource={DASHBOARD_DATA.inventoryAlerts}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.product}
                                        description={
                                            <Space direction="vertical" size={0}>
                                                <span>{item.affected_stores} stores affected</span>
                                                <Space>
                                                    <span>Total Stock: {item.total_stock}</span>
                                                    <Tag color={item.status === 'critical' ? 'error' : 'warning'}>
                                                        {item.status.toUpperCase()}
                                                    </Tag>
                                                </Space>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* Recent High-Value Orders */}
                    <Card title="Recent High-Value Orders" style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
                        <Table
                            columns={recentOrderColumns}
                            dataSource={DASHBOARD_DATA.recentHighValueOrders}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>
        </Page>
    </>)
}

export default ConsoleHome;
