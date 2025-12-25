'use client'

import { Avatar, DevBlock, List } from '@/components';
import { PageHeader } from '@/template';
import { ChangeMyPasswordButton } from '@/modules/user/components';
import {
    Card, Col, Row, Statistic, Descriptions, Tag, Space, Button,
    Timeline, Divider, Progress
} from 'antd';
import { useAppSelector } from '@/rStore/hooks';
import type { RootState } from '@/rStore';
import {
    UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined,
    ShoppingCartOutlined, TeamOutlined, DollarOutlined, CheckCircleOutlined,
    ClockCircleOutlined, LoginOutlined, SafetyOutlined, StarOutlined,
    TrophyOutlined, RiseOutlined, BellOutlined
} from '@ant-design/icons';

// Dummy Data for Admin Profile
const DUMMY_ADMIN_STATS = {
    orders_managed: 1247,
    customers_served: 856,
    revenue_processed: 125478.50,
    tasks_completed: 342,
    avg_response_time: '12 mins',
    satisfaction_rating: 4.8,
    stores_managed: 5,
    products_added: 234
};

const DUMMY_RECENT_ACTIVITIES = [
    { time: '2024-01-20 16:30', action: 'Approved order', details: 'Order #BOX-2024-1247', type: 'order' },
    { time: '2024-01-20 15:45', action: 'Updated product', details: 'Organic Avocado Bundle', type: 'product' },
    { time: '2024-01-20 14:20', action: 'Responded to query', details: 'Customer support ticket #5821', type: 'support' },
    { time: '2024-01-20 12:15', action: 'Added new staff', details: 'John Doe - Store Manager', type: 'staff' },
    { time: '2024-01-20 10:30', action: 'Generated report', details: 'Monthly Sales Report - January', type: 'report' },
    { time: '2024-01-19 18:45', action: 'Modified inventory', details: 'Updated stock levels for 15 products', type: 'inventory' },
    { time: '2024-01-19 16:20', action: 'Approved refund', details: 'Order #BOX-2024-1198 - $89.50', type: 'refund' },
    { time: '2024-01-19 14:10', action: 'Updated store hours', details: 'Downtown Store - Holiday Schedule', type: 'store' }
];

const DUMMY_PERMISSIONS = [
    'Manage Orders',
    'Manage Products',
    'Manage Customers',
    'Manage Staff',
    'View Reports',
    'Manage Inventory',
    'Process Refunds',
    'Manage Stores',
    'System Settings'
];

type Achievement = {
    title: string;
    description: string;
    icon: string;
    color: string;
};

const DUMMY_ACHIEVEMENTS: Achievement[] = [
    { title: 'Fast Responder', description: 'Avg response time under 15 mins', icon: '⚡', color: 'gold' },
    { title: 'Customer Champion', description: 'Served 500+ customers', icon: '🏆', color: 'blue' },
    { title: 'Sales Master', description: 'Processed $100K+ revenue', icon: '💰', color: 'green' },
    { title: 'Team Builder', description: 'Onboarded 20+ staff members', icon: '👥', color: 'purple' }
];

type Task = {
    task: string;
    status: 'completed' | 'in_progress' | 'pending';
    priority: 'high' | 'medium' | 'low';
};

const DUMMY_TASKS_TODAY: Task[] = [
    { task: 'Review pending orders', status: 'completed', priority: 'high' },
    { task: 'Update inventory reports', status: 'in_progress', priority: 'medium' },
    { task: 'Respond to customer queries', status: 'completed', priority: 'high' },
    { task: 'Approve new products', status: 'pending', priority: 'medium' },
    { task: 'Team meeting at 3 PM', status: 'pending', priority: 'low' }
];

const DUMMY_ADMIN_DETAILS = {
    role: 'Senior Admin',
    department: 'Operations',
    employee_id: 'EMP-2023-042',
    join_date: '2023-03-15',
    last_login: '2024-01-20T16:30:00Z',
    login_count: 487,
    phone: '+1 (555) 987-6543',
    timezone: 'PST (UTC-8)',
    working_hours: '9:00 AM - 6:00 PM'
};

function Profile() {
    const session = useAppSelector((state: RootState) => state.session);

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            order: 'blue',
            product: 'green',
            support: 'orange',
            staff: 'purple',
            report: 'cyan',
            inventory: 'geekblue',
            refund: 'red',
            store: 'magenta'
        };
        return colors[type] || 'default';
    };

    const getTaskStatusTag = (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
            completed: { color: 'success', text: 'COMPLETED' },
            in_progress: { color: 'processing', text: 'IN PROGRESS' },
            pending: { color: 'warning', text: 'PENDING' }
        };
        const config = statusConfig[status] || { color: 'default', text: status.toUpperCase() };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            high: 'red',
            medium: 'orange',
            low: 'blue'
        };
        return colors[priority] || 'default';
    };

    return (<>
        <PageHeader title="My Profile"></PageHeader>

        <Row gutter={[16, 16]}>
            {/* Left Column - Profile Info */}
            <Col xs={24} lg={8}>
                <Card title="Admin Profile" variant='outlined'>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <Avatar src={session.user.avatarUrl} size={120} />
                        <h2 style={{ marginTop: 16, marginBottom: 4 }}>{session.user.name}</h2>
                        <Tag color="purple">{DUMMY_ADMIN_DETAILS.role}</Tag>
                        <Tag color="blue">{DUMMY_ADMIN_DETAILS.department}</Tag>
                    </div>

                    <Descriptions column={1} size="small">
                        <Descriptions.Item label={<Space size={2}><MailOutlined /> Email</Space>}>
                            {session.user.email}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><PhoneOutlined /> Phone</Space>}>
                            {DUMMY_ADMIN_DETAILS.phone}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><IdcardOutlined /> Employee ID</Space>}>
                            {DUMMY_ADMIN_DETAILS.employee_id}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><UserOutlined /> Join Date</Space>}>
                            {new Date(DUMMY_ADMIN_DETAILS.join_date).toLocaleDateString()}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><LoginOutlined /> Last Login</Space>}>
                            {new Date(DUMMY_ADMIN_DETAILS.last_login).toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space size={2}><ClockCircleOutlined /> Working Hours</Space>}>
                            {DUMMY_ADMIN_DETAILS.working_hours}
                        </Descriptions.Item>
                        <Descriptions.Item label="Timezone">
                            {DUMMY_ADMIN_DETAILS.timezone}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Logins">
                            <Tag color="blue">{DUMMY_ADMIN_DETAILS.login_count}</Tag>
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <Space orientation="vertical" style={{ width: '100%' }}>
                        <Button type="primary" block icon={<UserOutlined />}>
                            Edit Profile
                        </Button>
                        <ChangeMyPasswordButton
                            buttonBlock={true}
                            buttonType="default"
                            buttonIcon={<SafetyOutlined />}
                        />
                        <Button type="default" block icon={<BellOutlined />}>
                            Notification Settings
                        </Button>
                    </Space>
                </Card>

                {/* Achievements */}
                <Card title="Achievements" variant='outlined' style={{ marginTop: 16 }}>
                    <List
                        size="small"
                        dataSource={DUMMY_ACHIEVEMENTS}
                        renderItem={(item: Achievement) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<span style={{ fontSize: 24 }}>{item.icon}</span>}
                                    title={<Tag color={item.color}>{item.title}</Tag>}
                                    description={item.description}
                                />
                            </List.Item>
                        )}
                    />
                </Card>

                {/* Permissions */}
                <Card title="Access Permissions" variant='outlined' style={{ marginTop: 16 }}>
                    <Space wrap>
                        {DUMMY_PERMISSIONS.map((permission, index) => (
                            <Tag key={index} color="green" icon={<CheckCircleOutlined />}>
                                {permission}
                            </Tag>
                        ))}
                    </Space>
                </Card>
            </Col>

            {/* Right Column - Stats and Activities */}
            <Col xs={24} lg={16}>
                {/* Performance Statistics */}
                <Card title="Performance Overview" variant='outlined'>
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Orders Managed"
                                value={DUMMY_ADMIN_STATS.orders_managed}
                                prefix={<ShoppingCartOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Customers Served"
                                value={DUMMY_ADMIN_STATS.customers_served}
                                prefix={<TeamOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Revenue Processed"
                                value={DUMMY_ADMIN_STATS.revenue_processed}
                                precision={2}
                                prefix={<DollarOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Tasks Completed"
                                value={DUMMY_ADMIN_STATS.tasks_completed}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Avg Response"
                                value={DUMMY_ADMIN_STATS.avg_response_time}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Rating"
                                value={DUMMY_ADMIN_STATS.satisfaction_rating}
                                precision={1}
                                prefix={<StarOutlined />}
                                suffix="/ 5.0"
                                styles={{
                                    content: {
                                        color: '#faad14'
                                    }
                                }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Stores Managed"
                                value={DUMMY_ADMIN_STATS.stores_managed}
                                prefix={<TrophyOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Products Added"
                                value={DUMMY_ADMIN_STATS.products_added}
                                prefix={<RiseOutlined />}
                            />
                        </Col>
                    </Row>

                    <Divider />

                    {/* Performance Indicators */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <div style={{ marginBottom: 8 }}>
                                <span>Task Completion Rate</span>
                                <span style={{ float: 'right', fontWeight: 'bold' }}>94%</span>
                            </div>
                            <Progress percent={94} status="active" strokeColor="#52c41a" />
                        </Col>
                        <Col xs={24} sm={12}>
                            <div style={{ marginBottom: 8 }}>
                                <span>Customer Satisfaction</span>
                                <span style={{ float: 'right', fontWeight: 'bold' }}>96%</span>
                            </div>
                            <Progress percent={96} status="active" strokeColor="#1890ff" />
                        </Col>
                        <Col xs={24} sm={12}>
                            <div style={{ marginBottom: 8 }}>
                                <span>Response Time Target</span>
                                <span style={{ float: 'right', fontWeight: 'bold' }}>88%</span>
                            </div>
                            <Progress percent={88} status="active" strokeColor="#faad14" />
                        </Col>
                        <Col xs={24} sm={12}>
                            <div style={{ marginBottom: 8 }}>
                                <span>Monthly Goals</span>
                                <span style={{ float: 'right', fontWeight: 'bold' }}>78%</span>
                            </div>
                            <Progress percent={78} status="active" />
                        </Col>
                    </Row>
                </Card>

                {/* Today's Tasks */}
                <Card title="Today's Tasks" variant='outlined' style={{ marginTop: 16 }}>
                    <List
                        dataSource={DUMMY_TASKS_TODAY}
                        renderItem={(item: Task) => (
                            <List.Item
                                key={item.task}
                                actions={[
                                    getTaskStatusTag(item.status)
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Tag color={getPriorityColor(item.priority)}>
                                            {item.priority.toUpperCase()}
                                        </Tag>
                                    }
                                    title={item.task}
                                />
                            </List.Item>
                        )}
                    />
                </Card>

                {/* Recent Activity Timeline */}
                <Card title="Recent Activity" variant='outlined' style={{ marginTop: 16 }}>
                    <Timeline
                        items={DUMMY_RECENT_ACTIVITIES.map((activity) => ({
                            color: getActivityColor(activity.type),
                            content: (<>
                                <p style={{ margin: 0 }}>
                                    <strong>{activity.action}</strong>
                                    <span style={{ float: 'right', color: '#999', fontSize: 12 }}>
                                        {activity.time}
                                    </span>
                                </p>
                                <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                                    {activity.details}
                                </p>
                            </>)
                        }))}
                    />
                </Card>
            </Col>
        </Row>

        {/* Debug Section - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
            <Card title="Debug Info" variant='outlined' style={{ marginTop: 16 }}>
                <DevBlock obj={session.user} />
            </Card>
        )}
    </>
    )
}

export default Profile;