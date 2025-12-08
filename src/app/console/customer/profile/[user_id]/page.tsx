'use client'

import React from 'react'
import { __error, __yellow } from '@_/lib/consoleHelper';
import { CustomerWrapper } from '@_/modules/customers';
import { Alert, Card, Col, Divider, Row, Table, Tag, Statistic, List, Timeline, Descriptions, Space, Button } from 'antd';
import { Avatar, DevBlock } from '@_/components';
import { PasswordUpdateButton } from '@_/modules/user/components';
import {
    PhoneOutlined, MailOutlined, EnvironmentOutlined, ShoppingCartOutlined, DollarOutlined, ClockCircleOutlined,
    TrophyOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined, UserOutlined
} from '@ant-design/icons';

// Dummy Data
const DUMMY_ADDRESSES = [
    {
        _id: 'addr_1',
        label: 'Home',
        address_line1: '123 Main Street',
        address_line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'USA',
        is_default: true,
        coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    {
        _id: 'addr_2',
        label: 'Office',
        address_line1: '456 Market Street',
        address_line2: 'Suite 200',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA',
        is_default: false,
        coordinates: { lat: 37.7849, lng: -122.4094 }
    },
    {
        _id: 'addr_3',
        label: 'Parents House',
        address_line1: '789 Oak Avenue',
        address_line2: '',
        city: 'Oakland',
        state: 'CA',
        zip: '94612',
        country: 'USA',
        is_default: false,
        coordinates: { lat: 37.8044, lng: -122.2712 }
    }
];

const DUMMY_RECENT_ORDERS = [
    {
        _id: 'ord_001',
        order_number: 'BOX-2024-001',
        created_at: '2024-01-20T14:30:00Z',
        status: 'delivered',
        total_amount: 125.50,
        items_count: 5,
        delivery_address: 'Home'
    },
    {
        _id: 'ord_002',
        order_number: 'BOX-2024-002',
        created_at: '2024-01-18T10:15:00Z',
        status: 'delivered',
        total_amount: 89.99,
        items_count: 3,
        delivery_address: 'Office'
    },
    {
        _id: 'ord_003',
        order_number: 'BOX-2024-003',
        created_at: '2024-01-15T16:45:00Z',
        status: 'cancelled',
        total_amount: 45.00,
        items_count: 2,
        delivery_address: 'Home'
    },
    {
        _id: 'ord_004',
        order_number: 'BOX-2024-004',
        created_at: '2024-01-12T12:00:00Z',
        status: 'delivered',
        total_amount: 210.75,
        items_count: 8,
        delivery_address: 'Home'
    },
    {
        _id: 'ord_005',
        order_number: 'BOX-2024-005',
        created_at: '2024-01-10T09:30:00Z',
        status: 'declined',
        total_amount: 67.50,
        items_count: 4,
        delivery_address: 'Office'
    }
];

const DUMMY_ACTIVITIES = [
    { time: '2024-01-20 14:30', action: 'Order placed', details: 'Order #BOX-2024-001', type: 'order' },
    { time: '2024-01-20 14:25', action: 'Added to cart', details: '3 items added', type: 'cart' },
    { time: '2024-01-20 10:15', action: 'Viewed product', details: 'Organic Vegetables Bundle', type: 'view' },
    { time: '2024-01-19 18:30', action: 'Logged in', details: 'iOS App', type: 'login' },
    { time: '2024-01-18 16:45', action: 'Order delivered', details: 'Order #BOX-2024-002', type: 'delivery' },
    { time: '2024-01-18 10:15', action: 'Order placed', details: 'Order #BOX-2024-002', type: 'order' },
    { time: '2024-01-17 20:00', action: 'Logged in', details: 'Web Browser', type: 'login' },
    { time: '2024-01-15 16:45', action: 'Order cancelled', details: 'Order #BOX-2024-003', type: 'cancel' }
];

const DUMMY_STATS = {
    total_orders: 47,
    total_spend: 4567.89,
    total_savings: 456.78,
    average_order_size: 97.19,
    successful_orders: 42,
    cancelled_orders: 3,
    declined_orders: 2,
    first_order_date: '2023-03-15T10:00:00Z',
    last_order_date: '2024-01-20T14:30:00Z',
    lifetime_value: 4567.89,
    total_items_purchased: 234
};

const DUMMY_USER_EXTRAS = {
    last_seen: '2024-01-20T15:45:00Z',
    member_since: '2023-03-15',
    loyalty_points: 1250,
    referral_count: 3,
    favorite_categories: ['Organic Vegetables', 'Dairy Products', 'Fresh Fruits'],
    preferred_payment: 'Credit Card ending in 4242',
    average_delivery_time: '45 minutes'
};

function CustomerDashboard({ user, session, refresh }: { user: any; session: any; refresh: () => void }) {
    if (!session || !session?.user?._id) return <Alert message="Invalid user session" showIcon type='error' />

    const getStatusColor = (status: string) => {
        const colors: Record<string, any> = {
            delivered: 'success',
            processing: 'processing',
            pending: 'warning',
            cancelled: 'default',
            declined: 'error'
        };
        return colors[status] || 'default';
    };

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            order: 'blue',
            delivery: 'green',
            cancel: 'red',
            login: 'purple',
            view: 'cyan',
            cart: 'orange'
        };
        return colors[type] || 'default';
    };

    const orderColumns = [
        {
            title: 'Order #',
            dataIndex: 'order_number',
            key: 'order_number',
            render: (text: string) => <a>{text}</a>
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
        },
        {
            title: 'Items',
            dataIndex: 'items_count',
            key: 'items_count'
        },
        {
            title: 'Total',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount: number) => `$${amount.toFixed(2)}`
        },
        {
            title: 'Delivery Address',
            dataIndex: 'delivery_address',
            key: 'delivery_address'
        }
    ];

    return (<>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* Customer Profile Section */}
            <Col xs={24} lg={8}>
                <Card title="Customer Profile" variant='outlined'>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <Avatar src={user?.avatarUrl} size={120} />
                        <h2 style={{ marginTop: 16, marginBottom: 4 }}>{user.name}</h2>
                        <Tag color="blue">Premium Member</Tag>
                    </div>

                    <Descriptions column={1} size="small">
                        <Descriptions.Item label={<Space size={2}><MailOutlined /> Email</Space>}>
                            {user.email}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><PhoneOutlined /> Phone</Space>}>
                            {user.phone || '+1 (555) 123-4567'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><ClockCircleOutlined /> Last Seen</Space>}>
                            {new Date(DUMMY_USER_EXTRAS.last_seen).toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><UserOutlined /> Member Since</Space>}>
                            {new Date(DUMMY_USER_EXTRAS.member_since).toLocaleDateString()}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><TrophyOutlined /> Loyalty Points</Space>}>
                            <Tag color="gold">{DUMMY_USER_EXTRAS.loyalty_points} points</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Referrals">
                            {DUMMY_USER_EXTRAS.referral_count} customers
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <Space direction="vertical" style={{ width: '100%' }}>
                        <PasswordUpdateButton _id={user._id} query_type="updateUserPwd" />
                        <Button type="default" block>Send Email</Button>
                        <Button type="default" block>Send SMS</Button>
                    </Space>
                </Card>

                {/* Favorite Categories */}
                <Card title="Favorite Categories" variant='outlined' style={{ marginTop: 16 }}>
                    <List
                        size="small"
                        dataSource={DUMMY_USER_EXTRAS.favorite_categories}
                        renderItem={(item) => (
                            <List.Item>
                                <Tag color="green">{item}</Tag>
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>

            {/* Stats and Orders Section */}
            <Col xs={24} lg={16}>
                {/* Purchase Statistics */}
                <Card title="Purchase Statistics" variant='outlined'>
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Total Orders"
                                value={DUMMY_STATS.total_orders}
                                prefix={<ShoppingCartOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Total Spend"
                                value={DUMMY_STATS.total_spend}
                                precision={2}
                                prefix={<DollarOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Total Savings"
                                value={DUMMY_STATS.total_savings}
                                precision={2}
                                prefix="$"
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Avg Order Size"
                                value={DUMMY_STATS.average_order_size}
                                precision={2}
                                prefix="$"
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Successful"
                                value={DUMMY_STATS.successful_orders}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Cancelled"
                                value={DUMMY_STATS.cancelled_orders}
                                prefix={<StopOutlined />}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Declined"
                                value={DUMMY_STATS.declined_orders}
                                prefix={<CloseCircleOutlined />}
                                valueStyle={{ color: '#d46b08' }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Items Purchased"
                                value={DUMMY_STATS.total_items_purchased}
                            />
                        </Col>
                    </Row>

                    <Divider />

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="First Order">
                                    {new Date(DUMMY_STATS.first_order_date).toLocaleDateString()}
                                </Descriptions.Item>
                                <Descriptions.Item label="Last Order">
                                    {new Date(DUMMY_STATS.last_order_date).toLocaleDateString()}
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                        <Col span={12}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Lifetime Value">
                                    <strong>${DUMMY_STATS.lifetime_value.toFixed(2)}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Avg Delivery Time">
                                    {DUMMY_USER_EXTRAS.average_delivery_time}
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                    </Row>
                </Card>

                {/* Recent Orders */}
                <Card title="Recent Orders" variant='outlined' style={{ marginTop: 16 }}>
                    <Table
                        columns={orderColumns}
                        dataSource={DUMMY_RECENT_ORDERS}
                        rowKey="_id"
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>

                {/* Delivery Addresses */}
                <Card title="Delivery Addresses" variant='outlined' style={{ marginTop: 16 }}>
                    <List
                        dataSource={DUMMY_ADDRESSES}
                        renderItem={(address) => (
                            <List.Item
                                key={address._id || address.label}
                                actions={[
                                    <span key="default">{address.is_default ? <Tag color="blue">Default</Tag> : <a>Set Default</a>}</span>,
                                    <a key="edit">Edit</a>,
                                    <a key="delete" style={{ color: 'red' }}>Delete</a>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<EnvironmentOutlined style={{ fontSize: 24 }} />}
                                    title={<strong>{address.label}</strong>}
                                    description={
                                        <>
                                            <div>{address.address_line1}</div>
                                            {address.address_line2 && <div>{address.address_line2}</div>}
                                            <div>{address.city}, {address.state} {address.zip}</div>
                                            <div>{address.country}</div>
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>

                {/* User Activity Timeline */}
                <Card title="Recent Activity" variant='outlined' style={{ marginTop: 16 }}>
                    <Timeline
                        items={DUMMY_ACTIVITIES.map((activity) => ({
                            color: getActivityColor(activity.type),
                            children: (
                                <>
                                    <p style={{ margin: 0 }}>
                                        <strong>{activity.action}</strong>
                                        <span style={{ float: 'right', color: '#999', fontSize: 12 }}>
                                            {activity.time}
                                        </span>
                                    </p>
                                    <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                                        {activity.details}
                                    </p>
                                </>
                            )
                        }))}
                    />
                </Card>
            </Col>
        </Row>

        {/* Debug Section - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
            <Card title="Debug Info" variant='outlined'>
                <DevBlock obj={user} />
            </Card>
        )}
    </>)
}

function Wrapper(props:any){
    return (<CustomerWrapper {...props} render={({ user, session, refresh }: { user: any; session: any; refresh: () => void }) => (<CustomerDashboard user={user} session={session} refresh={refresh} {...props} />)} />)
}

export default Wrapper;
