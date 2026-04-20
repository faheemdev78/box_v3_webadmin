'use client'

import React, { useState, useEffect } from 'react'
import { Form as FinalForm } from 'react-final-form';
// import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import { Card, Col, Row, Descriptions, Tag, Table, Statistic, Progress, Avatar, Space, Button, Timeline, Alert, Modal, message } from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
    StarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CalendarOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    BankOutlined, BarcodeOutlined,
} from '@ant-design/icons';
import { useMutation } from '@apollo/client/react';
import { usePageProps, Drawer, Loader, DevBlock, IconButton, PopMenu } from '@/components';
import { FormField, SubmitButton, rules } from '@/components/form';
import { StaffEditForm } from '@/modules/staff';


// box_v3_webadmin/src/graphql/users/user.graphql
import GET_USER from '@/graphql/users/user.graphql';
import UPDATE_USER_PWD from '@/graphql/users/updateUserPassword.graphql';

// Dummy Staff Data
const DUMMY_STAFF = {
    _id: 'staff_001',
    name: 'John Smith',
    email: 'john.smith@boxstore.com',
    phone: '+1 (555) 234-5678',
    avatarUrl: 'https://i.pravatar.cc/300?img=12',
    position: 'Store Manager',
    department: 'Operations',
    employee_id: 'EMP-2023-001',
    join_date: '2023-03-15',
    status: 'active',
    shift: 'Morning (8 AM - 4 PM)',
    hourly_rate: 25.50,
    acc_type: 'staff',
    acc_group: 'manager'
};

// Dummy Attendance Data for Current Month
const DUMMY_ATTENDANCE = [
    { date: '2024-01-01', status: 'present', check_in: '08:00 AM', check_out: '04:00 PM', hours: 8 },
    { date: '2024-01-02', status: 'present', check_in: '08:05 AM', check_out: '04:02 PM', hours: 7.95 },
    { date: '2024-01-03', status: 'present', check_in: '07:55 AM', check_out: '04:10 PM', hours: 8.25 },
    { date: '2024-01-04', status: 'present', check_in: '08:10 AM', check_out: '04:05 PM', hours: 7.92 },
    { date: '2024-01-05', status: 'present', check_in: '08:00 AM', check_out: '04:00 PM', hours: 8 },
    { date: '2024-01-06', status: 'weekend', check_in: '-', check_out: '-', hours: 0 },
    { date: '2024-01-07', status: 'weekend', check_in: '-', check_out: '-', hours: 0 },
    { date: '2024-01-08', status: 'present', check_in: '08:02 AM', check_out: '04:00 PM', hours: 7.97 },
    { date: '2024-01-09', status: 'present', check_in: '08:00 AM', check_out: '04:15 PM', hours: 8.25 },
    { date: '2024-01-10', status: 'late', check_in: '08:30 AM', check_out: '04:30 PM', hours: 8 },
    { date: '2024-01-11', status: 'present', check_in: '07:58 AM', check_out: '04:05 PM', hours: 8.12 },
    { date: '2024-01-12', status: 'absent', check_in: '-', check_out: '-', hours: 0 },
    { date: '2024-01-13', status: 'weekend', check_in: '-', check_out: '-', hours: 0 },
    { date: '2024-01-14', status: 'weekend', check_in: '-', check_out: '-', hours: 0 },
    { date: '2024-01-15', status: 'present', check_in: '08:00 AM', check_out: '04:00 PM', hours: 8 },
    { date: '2024-01-16', status: 'present', check_in: '08:05 AM', check_out: '04:10 PM', hours: 8.08 },
    { date: '2024-01-17', status: 'half-day', check_in: '08:00 AM', check_out: '12:00 PM', hours: 4 },
    { date: '2024-01-18', status: 'present', check_in: '08:00 AM', check_out: '04:00 PM', hours: 8 },
    { date: '2024-01-19', status: 'present', check_in: '07:55 AM', check_out: '04:05 PM', hours: 8.17 },
    { date: '2024-01-20', status: 'weekend', check_in: '-', check_out: '-', hours: 0 },
];

// Attendance Summary
const ATTENDANCE_SUMMARY = {
    total_days: 20,
    present_days: 14,
    absent_days: 1,
    late_days: 1,
    half_days: 1,
    weekend_days: 4,
    total_hours: 114.71,
    average_hours: 8.19,
    attendance_rate: 93.3
};

// Performance Metrics
const PERFORMANCE_METRICS = {
    overall_rating: 4.5,
    orders_processed: 387,
    customer_satisfaction: 4.7,
    efficiency_score: 92,
    quality_score: 88,
    teamwork_score: 95,
    punctuality_score: 90,
    sales_target_achievement: 105,
    monthly_sales: 45678.90,
    customer_complaints: 2,
    customer_compliments: 15,
    training_completed: 8,
    training_pending: 2
};

// Recent Activities
const RECENT_ACTIVITIES = [
    { time: '2024-01-20 15:45', action: 'Processed order', details: 'Order #BOX-2024-387', type: 'order' },
    { time: '2024-01-20 14:30', action: 'Customer assistance', details: 'Helped customer with product selection', type: 'customer' },
    { time: '2024-01-20 11:15', action: 'Inventory check', details: 'Completed morning inventory audit', type: 'task' },
    { time: '2024-01-20 08:00', action: 'Checked in', details: 'Started shift on time', type: 'checkin' },
    { time: '2024-01-19 16:00', action: 'Training completed', details: 'Customer Service Excellence', type: 'training' },
    { time: '2024-01-19 13:30', action: 'Team meeting', details: 'Weekly operations review', type: 'meeting' },
    { time: '2024-01-18 10:00', action: 'Customer compliment', details: 'Received positive feedback', type: 'achievement' }
];

// Performance History (Last 6 months)
const PERFORMANCE_HISTORY = [
    { month: 'Aug 2023', rating: 4.2, orders: 345, satisfaction: 4.5, efficiency: 88 },
    { month: 'Sep 2023', rating: 4.3, orders: 362, satisfaction: 4.6, efficiency: 89 },
    { month: 'Oct 2023', rating: 4.4, orders: 371, satisfaction: 4.6, efficiency: 90 },
    { month: 'Nov 2023', rating: 4.4, orders: 380, satisfaction: 4.7, efficiency: 91 },
    { month: 'Dec 2023', rating: 4.5, orders: 395, satisfaction: 4.7, efficiency: 92 },
    { month: 'Jan 2024', rating: 4.5, orders: 387, satisfaction: 4.7, efficiency: 92 }
];

// const StaffProfileEditform = ({ initialValues }: { initialValues: any; }) => {
//     return (<></>)
// }

const StaffProfileView = ({ staff, onProfileEditComplete }: { staff: any; onProfileEditComplete: any; }) => {
    const [openProfileEditor, set_openProfileEditor] = useState(false)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [updateUserPassword] = useMutation(UPDATE_USER_PWD);

    function _onProfileEditComplete(args: any){
        onProfileEditComplete(args)
        set_openProfileEditor(false)
    }

    const onPasswordUpdate = async (values: any) => {
        if (!staff?._id) {
            message.error("Unable to update password: user reference is missing");
            return false;
        }

        if (!values?.password || values.password !== values?.password_confirm) {
            message.error("Password and confirmation do not match");
            return false;
        }

        const input = {
            _id: staff._id,
            password: values.password,
        };

        const results = await updateUserPassword({ variables: { input } }).then((r: any) => r?.data?.updateUserPassword);

        if (!results || results.error) {
            message.error((results && results.error?.message) || "Unable to update password");
            return false;
        }

        message.success("Password updated successfully");
        setIsPasswordModalOpen(false);
        return "reset";
    }

    return (<>
        <Card title="Staff Information">
            <Row gutter={[10, 10]} className='nowrap'>
                <Col style={{ textAlign:"center" }}><Space orientation='vertical'>
                    <Avatar src={staff.avatarUrl} size={120} icon={<UserOutlined />} />
                    <div><Tag color={staff.status === 'active' ? "#187c18" : 'red'}>{staff.status.toUpperCase()}</Tag></div>
                </Space></Col>
                <Col flex="auto">
                    <h2 style={{ marginTop: 16, marginBottom: 4 }}>{staff.name}</h2>
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>{staff.email}</Descriptions.Item>
                        <Descriptions.Item label={<Space><PhoneOutlined /> Phone</Space>}>{staff.phone}</Descriptions.Item>
                        <Descriptions.Item label={<Space><BankOutlined /> Store</Space>}>{staff.store.title}</Descriptions.Item>
                        <Descriptions.Item label={<>Employee ID</>}>{staff._id}</Descriptions.Item>
                        <Descriptions.Item label={<Space><CalendarOutlined /> Join Date</Space>}>{new Date(staff.createdAt).toLocaleDateString()}</Descriptions.Item>
                        {/* <Descriptions.Item label="Status"><Tag color="green">{staff.status.toUpperCase()}</Tag></Descriptions.Item> */}
                    </Descriptions>
                </Col>
            </Row>

            <div style={{ position:"absolute", top:10, right:10 }}>
                <PopMenu orientation="vertical" size="small" shape="round" placement="leftTop" items={[
                    { onClick: () => set_openProfileEditor(true), label: "Edit" },
                    { onClick: () => setIsPasswordModalOpen(true), label: "Change Password" },
                    // { onClick: () => console.log("field._id"), label: "Reset Password", type: 'delete' }
                ]} />
            </div>
            {/* <div style={{ textAlign: 'center', marginBottom: 20 }}></div> */}

            {/* <Descriptions column={1} size="small">
                <Descriptions.Item label="Store">{staff.store.title}</Descriptions.Item>
                <Descriptions.Item label="Employee ID">{staff._id}</Descriptions.Item>
                <Descriptions.Item label={<Space><CalendarOutlined /> Join Date</Space>}>{new Date(staff.createdAt).toLocaleDateString()}</Descriptions.Item>
                <Descriptions.Item label="Shift">{DUMMY_STAFF.shift}</Descriptions.Item>
                <Descriptions.Item label="Hourly Rate">${DUMMY_STAFF.hourly_rate}/hr</Descriptions.Item>
            </Descriptions> */}

            {/* <div style={{ marginTop: 20 }}>
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Button onClick={() => set_openProfileEditor(true)} type="primary" block>Edit Profile</Button>
                    <Button type="default" block>View Schedule</Button>
                    <Button type="default" block>Send Message</Button>
                </Space>
            </div> */}
        </Card>

        <Drawer open={openProfileEditor} onClose={() => set_openProfileEditor(false)}>
            {openProfileEditor && <><StaffEditForm user_id={staff._id} onSuccess={_onProfileEditComplete} /></>}
        </Drawer>

        <Modal
            title="Update User Password"
            open={isPasswordModalOpen}
            footer={null}
            onCancel={() => setIsPasswordModalOpen(false)}
            width={500}
        >
            {isPasswordModalOpen && (
                <FinalForm
                    onSubmit={onPasswordUpdate}
                    render={(formargs: any) => {
                        const { handleSubmit, submitting, invalid } = formargs;

                        return (
                            <form id="staff_password_reset_form" onSubmit={handleSubmit}>
                                <Row gutter={[10, 20]}>
                                    <Col span={24}>
                                        <FormField
                                            name="password"
                                            label="New Password"
                                            type="password"
                                            validate={rules.required}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <FormField
                                            name="password_confirm"
                                            label="Confirm Password"
                                            type="password"
                                            validate={rules.required}
                                        />
                                    </Col>
                                </Row>

                                <div style={{ marginTop: 24, textAlign: "right" }}>
                                    <Button onClick={() => setIsPasswordModalOpen(false)} style={{ marginRight: 8 }}>
                                        Cancel
                                    </Button>
                                    <SubmitButton
                                        loading={submitting}
                                        disabled={invalid || submitting}
                                        color="primary"
                                        label="Update Password"
                                    />
                                </div>
                            </form>
                        );
                    }}
                />
            )}
        </Modal>


    </>)
    // return (<>
    //     <Card title="Staff Information">
    //         <div style={{ textAlign: 'center', marginBottom: 20 }}>
    //             <Avatar src={DUMMY_STAFF.avatarUrl} size={120} icon={<UserOutlined />} />
    //             <h2 style={{ marginTop: 16, marginBottom: 4 }}>{DUMMY_STAFF.name}</h2>
    //             <Tag color="blue">{DUMMY_STAFF.position}</Tag>
    //         </div>

    //         <Descriptions column={1} size="small">
    //             <Descriptions.Item label="Employee ID">
    //                 {DUMMY_STAFF.employee_id}
    //             </Descriptions.Item>
    //             <Descriptions.Item label={<><MailOutlined /> Email</>}>
    //                 {DUMMY_STAFF.email}
    //             </Descriptions.Item>
    //             <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
    //                 {DUMMY_STAFF.phone}
    //             </Descriptions.Item>
    //             <Descriptions.Item label="Department">
    //                 {DUMMY_STAFF.department}
    //             </Descriptions.Item>
    //             <Descriptions.Item label={<><CalendarOutlined /> Join Date</>}>
    //                 {new Date(DUMMY_STAFF.join_date).toLocaleDateString()}
    //             </Descriptions.Item>
    //             <Descriptions.Item label="Status">
    //                 <Tag color="green">{DUMMY_STAFF.status.toUpperCase()}</Tag>
    //             </Descriptions.Item>
    //             <Descriptions.Item label="Shift">
    //                 {DUMMY_STAFF.shift}
    //             </Descriptions.Item>
    //             <Descriptions.Item label="Hourly Rate">
    //                 ${DUMMY_STAFF.hourly_rate}/hr
    //             </Descriptions.Item>
    //         </Descriptions>

    //         <div style={{ marginTop: 20 }}>
    //             <Space orientation="vertical" style={{ width: '100%' }}>
    //                 <Button onClick={() => set_openProfileEditor(true)} type="primary" block>Edit Profile</Button>
    //                 <Button type="default" block>View Schedule</Button>
    //                 <Button type="default" block>Send Message</Button>
    //             </Space>
    //         </div>
    //     </Card>

    //     <Drawer open={openProfileEditor} onClose={() => set_openProfileEditor(false)}>
    //         {openProfileEditor && <></>}
    //     </Drawer>

    //     <DevBlock obj={user} />

    // </>)
}

export function StaffProfile(props: any) {
    // const { user_id, ...params } = useParams();
    // const [get_product, { loading, called }] = useLazyQuery(GET_PRODUCT, { fetchPolicy: 'network-only' });
    // const { data: user, loading, error } = useQuery<any>(GET_USER, {
    //     variables: { _id: user_id },
    //     fetchPolicy: "no-cache",
    //     // onError: (error) => message.error(`Failed to load entity config: ${error.message}`)
    // });

    // const pageProps = (usePageProps() as any) || {};
    // console.log({ user_id })

    // console.log({ props })

    const getAttendanceStatus = (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
            present: { color: 'success', text: 'Present' },
            absent: { color: 'error', text: 'Absent' },
            late: { color: 'warning', text: 'Late' },
            'half-day': { color: 'processing', text: 'Half Day' },
            weekend: { color: 'default', text: 'Weekend' }
        };
        return statusConfig[status] || { color: 'default', text: status };
    };

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            order: 'blue',
            customer: 'green',
            task: 'cyan',
            checkin: 'purple',
            training: 'orange',
            meeting: 'magenta',
            achievement: 'gold'
        };
        return colors[type] || 'default';
    };

    const attendanceColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config = getAttendanceStatus(status);
                return <Tag color={config.color}>{config.text}</Tag>;
            }
        },
        {
            title: 'Check In',
            dataIndex: 'check_in',
            key: 'check_in'
        },
        {
            title: 'Check Out',
            dataIndex: 'check_out',
            key: 'check_out'
        },
        {
            title: 'Hours',
            dataIndex: 'hours',
            key: 'hours',
            render: (hours: number) => hours > 0 ? hours.toFixed(2) : '-'
        }
    ];

    const performanceHistoryColumns = [
        {
            title: 'Month',
            dataIndex: 'month',
            key: 'month'
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating: number) => (
                <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    {rating.toFixed(1)}
                </Space>
            )
        },
        {
            title: 'Orders',
            dataIndex: 'orders',
            key: 'orders'
        },
        {
            title: 'Satisfaction',
            dataIndex: 'satisfaction',
            key: 'satisfaction',
            render: (score: number) => `${score.toFixed(1)}/5.0`
        },
        {
            title: 'Efficiency',
            dataIndex: 'efficiency',
            key: 'efficiency',
            render: (score: number) => (
                <Progress percent={score} size="small" status="active" />
            )
        }
    ];

    function onProfileEditComplete(args: any){}

    // if (loading) return <Loader loading={true} />
    // if (error) return <Alert title={"Error fetching user"} description={error.message} type="error" showIcon />
    // if (!user || !user._id) return <Alert title={"User not found"} type="error" showIcon />


    return (<>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* Staff Profile Section */}
            <Col xs={24} lg={8}>
                <StaffProfileView staff={props.staff} onProfileEditComplete={onProfileEditComplete} />

                {/* Recent Activities */}
                <Card title="Recent Activities" style={{ marginTop: 16 }}>
                    <Timeline
                        items={RECENT_ACTIVITIES.map((activity) => ({
                            color: getActivityColor(activity.type),
                            content: (<>
                                <p style={{ margin: 0 }}>
                                    <strong>{activity.action}</strong>
                                    <span style={{ float: 'right', color: '#999', fontSize: 12 }}>{activity.time.split(' ')[1]}</span>
                                </p>
                                <p style={{ margin: 0, color: '#666', fontSize: 12 }}>{activity.details}</p>
                            </>)
                        }))}
                    />
                </Card>
            </Col>

            {/* Main Content Section */}
            <Col xs={24} lg={16}>
                {/* Performance Overview */}
                <Card title="Performance Overview - Current Month">
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Overall Rating"
                                value={PERFORMANCE_METRICS.overall_rating}
                                suffix="/ 5.0"
                                prefix={<StarOutlined style={{ color: '#faad14' }} />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Orders Processed"
                                value={PERFORMANCE_METRICS.orders_processed}
                                prefix={<ShoppingCartOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Customer Satisfaction"
                                value={PERFORMANCE_METRICS.customer_satisfaction}
                                suffix="/ 5.0"
                                prefix={<TrophyOutlined />}
                                styles={{
                                    content: { color: '#3f8600' }
                                }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                            <Statistic
                                title="Monthly Sales"
                                value={PERFORMANCE_METRICS.monthly_sales}
                                precision={2}
                                prefix={<DollarOutlined />}
                            />
                        </Col>
                    </Row>

                    <div style={{ marginTop: 24 }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <div style={{ marginBottom: 8 }}>Efficiency Score</div>
                                    <Progress
                                        percent={PERFORMANCE_METRICS.efficiency_score}
                                        status="active"
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <div style={{ marginBottom: 8 }}>Quality Score</div>
                                    <Progress
                                        percent={PERFORMANCE_METRICS.quality_score}
                                        status="active"
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <div style={{ marginBottom: 8 }}>Teamwork Score</div>
                                    <Progress
                                        percent={PERFORMANCE_METRICS.teamwork_score}
                                        status="active"
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <div style={{ marginBottom: 8 }}>Punctuality Score</div>
                                    <Progress
                                        percent={PERFORMANCE_METRICS.punctuality_score}
                                        status="active"
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <div style={{ marginBottom: 8 }}>Sales Target</div>
                                    <Progress
                                        percent={PERFORMANCE_METRICS.sales_target_achievement}
                                        status="active"
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                                    <Statistic
                                        title="Compliments"
                                        value={PERFORMANCE_METRICS.customer_compliments}
                                        prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                        styles={{
                                            content: { color: '#52c41a' }
                                        }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffccc7' }}>
                                    <Statistic
                                        title="Complaints"
                                        value={PERFORMANCE_METRICS.customer_complaints}
                                        prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                        styles={{
                                            content: { color: '#ff4d4f' }
                                        }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}>
                                    <Statistic
                                        title="Training (Completed)"
                                        value={PERFORMANCE_METRICS.training_completed}
                                        suffix={`/ ${PERFORMANCE_METRICS.training_completed + PERFORMANCE_METRICS.training_pending}`}
                                        prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
                                        styles={{
                                            content: { color: '#1890ff' }
                                        }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </Card>

                {/* Attendance Section */}
                <Card
                    title="Attendance - Current Month (January 2024)"
                    style={{ marginTop: 16 }}
                >
                    {/* Attendance Summary */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="Total Days"
                                value={ATTENDANCE_SUMMARY.total_days}
                                prefix={<CalendarOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="Present"
                                value={ATTENDANCE_SUMMARY.present_days}
                                styles={{
                                    content: { color: '#3f8600' }
                                }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="Absent"
                                value={ATTENDANCE_SUMMARY.absent_days}
                                styles={{
                                    content: { color: '#cf1322' }
                                }}
                                prefix={<CloseCircleOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="Late"
                                value={ATTENDANCE_SUMMARY.late_days}
                                styles={{
                                    content: { color: '#d46b08' }
                                }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="Total Hours"
                                value={ATTENDANCE_SUMMARY.total_hours}
                                precision={1}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <div>
                                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Attendance Rate</div>
                                <Progress
                                    type="circle"
                                    percent={ATTENDANCE_SUMMARY.attendance_rate}
                                    size={60}
                                    strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Attendance Table */}
                    <Table
                        columns={attendanceColumns}
                        dataSource={DUMMY_ATTENDANCE}
                        rowKey="date"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 'max-content' }}
                        size="small"
                    />
                </Card>

                {/* Performance History */}
                <Card title="Performance History (Last 6 Months)" style={{ marginTop: 16 }}>
                    <Table
                        columns={performanceHistoryColumns}
                        dataSource={PERFORMANCE_HISTORY}
                        rowKey="month"
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            </Col>
        </Row>


    </>);
}
