'use client'

import React, { useState } from 'react'
import { Alert, Card, Col, Row, Statistic, Table, Tag, Progress, List, Timeline, Space } from 'antd';
import {
    ShoppingCartOutlined,
    UserOutlined,
    RiseOutlined,
    FallOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    WarningOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons';
import { StatusTag } from '@_/components';
import StoreWrapper from '@/modules/store/storeWrapper';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';
import { publishStatus } from '@_/configs';
import { useAppSelector } from '@_/rStore/hooks';
import { getSettings } from '@_/rStore/slices/systemSlice';

// Dummy Data for Dashboard
const DASHBOARD_DATA = {
    // Today's Overview
    todayStats: {
        revenue: 2847.50,
        orders: 34,
        customers: 28,
        avgOrderValue: 83.75,
        completionRate: 91.2
    },

    // Comparison with yesterday
    comparison: {
        revenue: 12.5, // % increase
        orders: 8.3,
        customers: -3.2,
        avgOrderValue: 5.1
    },

    // This Month Summary
    monthStats: {
        revenue: 68450.00,
        orders: 842,
        newCustomers: 156,
        returningCustomers: 234,
        avgOrderValue: 81.30,
        totalCustomers: 390
    },

    // Order Status Breakdown
    ordersByStatus: {
        pending: 12,
        processing: 8,
        ready_for_pickup: 5,
        out_for_delivery: 9,
        delivered: 156,
        cancelled: 6,
        declined: 4
    },

    // Revenue Chart Data (Last 7 days)
    revenueChart: [
        { day: 'Mon', revenue: 2450, orders: 32 },
        { day: 'Tue', revenue: 2890, orders: 38 },
        { day: 'Wed', revenue: 2150, orders: 28 },
        { day: 'Thu', revenue: 3200, orders: 42 },
        { day: 'Fri', revenue: 3650, orders: 48 },
        { day: 'Sat', revenue: 4100, orders: 54 },
        { day: 'Sun', revenue: 2850, orders: 36 }
    ],

    // Top Selling Products
    topProducts: [
        { id: 1, name: 'Organic Vegetables Bundle', sold: 145, revenue: 4350.00, trend: 'up' },
        { id: 2, name: 'Fresh Milk (1L)', sold: 234, revenue: 1404.00, trend: 'up' },
        { id: 3, name: 'Whole Wheat Bread', sold: 198, revenue: 594.00, trend: 'down' },
        { id: 4, name: 'Free Range Eggs (12)', sold: 167, revenue: 1002.00, trend: 'up' },
        { id: 5, name: 'Cheese Variety Pack', sold: 89, revenue: 1335.00, trend: 'up' }
    ],

    // Recent Orders
    recentOrders: [
        { id: 'ORD-001', customer: 'John Doe', amount: 125.50, status: 'delivered', time: '10 mins ago' },
        { id: 'ORD-002', customer: 'Jane Smith', amount: 89.99, status: 'out_for_delivery', time: '25 mins ago' },
        { id: 'ORD-003', customer: 'Mike Johnson', amount: 234.00, status: 'processing', time: '1 hour ago' },
        { id: 'ORD-004', customer: 'Sarah Wilson', amount: 67.50, status: 'pending', time: '2 hours ago' },
        { id: 'ORD-005', customer: 'Tom Brown', amount: 156.75, status: 'ready_for_pickup', time: '3 hours ago' }
    ],

    // Staff Performance
    staffPerformance: [
        { name: 'John Smith', orders: 48, rating: 4.8, efficiency: 95 },
        { name: 'Sarah Lee', orders: 42, rating: 4.9, efficiency: 92 },
        { name: 'Mike Davis', orders: 38, rating: 4.7, efficiency: 88 },
        { name: 'Emily Chen', orders: 35, rating: 4.6, efficiency: 90 }
    ],

    // Inventory Alerts
    inventoryAlerts: [
        { product: 'Fresh Milk (1L)', stock: 12, threshold: 20, status: 'low' },
        { product: 'Organic Tomatoes', stock: 5, threshold: 15, status: 'critical' },
        { product: 'Whole Wheat Bread', stock: 8, threshold: 10, status: 'low' },
        { product: 'Free Range Eggs', stock: 3, threshold: 20, status: 'critical' }
    ],

    // Recent Activities
    recentActivities: [
        { time: '5 mins ago', action: 'New order placed', user: 'John Doe', type: 'order' },
        { time: '15 mins ago', action: 'Order delivered', user: 'Jane Smith', type: 'delivery' },
        { time: '30 mins ago', action: 'Staff checked in', user: 'Mike (Staff)', type: 'staff' },
        { time: '1 hour ago', action: 'Inventory updated', user: 'System', type: 'inventory' },
        { time: '2 hours ago', action: 'New customer registered', user: 'Tom Brown', type: 'customer' }
    ],

    // Customer Stats
    customerStats: {
        total: 1247,
        new_this_month: 156,
        active: 892,
        avg_lifetime_value: 456.78,
        top_spender: { name: 'Alice Johnson', spent: 2345.67 }
    }
};

interface StoreHome_Props {
    store: any;
    onStatusUpdate?: Function;
}

function StoreHome({ store, onStatusUpdate }: StoreHome_Props) {
  const { currency } = useAppSelector(getSettings)

  const CurrencyIcon = ({ size = "25", style = {} }) => (<span style={{ 
      border: "2px solid green", borderRadius: "30px", 
      width: `${size}px`, height: `${size}px`, display: "inline-flex", alignItems: "center", justifyContent: "center", 
      lineHeight: 1, fontSize: "14px", 
      margin: "0", position: "relative", top: "-2px",
      ...style
    }}>{currency}</span>)

  const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
          delivered: 'success',
          out_for_delivery: 'processing',
          ready_for_pickup: 'cyan',
          processing: 'blue',
          pending: 'warning',
          cancelled: 'default',
          declined: 'error'
      };
      return colors[status] || 'default';
  };

  const getTrendIcon = (trend: string) => {
      return trend === 'up' ? <ArrowUpOutlined style={{ color: '#52c41a' }} /> : <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
  };

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
      },
      {
          title: 'Time',
          dataIndex: 'time',
          key: 'time'
      }
  ];

  const topProductColumns = [
      { title: 'Product', dataIndex: 'name', key: 'name' },
      { title: 'Units Sold', dataIndex: 'sold', key: 'sold',
          render: (sold: number, record: any) => (
              <Space>{sold} {getTrendIcon(record.trend)}</Space>
          )
      },
      { title: 'Revenue', dataIndex: 'revenue', key: 'revenue',
          render: (revenue: number) => `${currency}${revenue.toFixed(2)}`
      }
  ];

  const staffColumns = [
      {
          title: 'Staff Name',
          dataIndex: 'name',
          key: 'name'
      },
      {
          title: 'Orders',
          dataIndex: 'orders',
          key: 'orders'
      },
      {
          title: 'Rating',
          dataIndex: 'rating',
          key: 'rating',
          render: (rating: number) => `${rating}/5.0`
      },
      {
          title: 'Efficiency',
          dataIndex: 'efficiency',
          key: 'efficiency',
          render: (efficiency: number) => <Progress percent={efficiency} size="small" />
      }
  ];

  return (<>
    <PageHeader
        title={store.title}
        sub={<>
            <StatusTag value={store.status} editable={true} options={publishStatus} onSubmit={onStatusUpdate as any} />
            <div>{store.code}</div>
        </>}
    >
    </PageHeader>
      
    <Page>
      {/* Today's Performance */}
      {/* <Card title="Today's Performance" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                  <Card>
                      <Statistic
                          title="Revenue"
                          value={DASHBOARD_DATA.todayStats.revenue}
                          precision={2}
                          prefix={<CurrencyIcon />}
                          suffix={
                              <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.revenue > 0 ? '#3f8600' : '#cf1322' }}>
                                  {DASHBOARD_DATA.comparison.revenue > 0 ? <RiseOutlined /> : <FallOutlined />}
                                  {Math.abs(DASHBOARD_DATA.comparison.revenue)}%
                              </span>
                          }
                          valueStyle={{ color: '#3f8600' }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
                  </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                  <Card>
                      <Statistic
                          title="Orders"
                          value={DASHBOARD_DATA.todayStats.orders}
                          prefix={<ShoppingCartOutlined />}
                          suffix={
                              <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.orders > 0 ? '#3f8600' : '#cf1322' }}>
                                  {DASHBOARD_DATA.comparison.orders > 0 ? <RiseOutlined /> : <FallOutlined />}
                                  {Math.abs(DASHBOARD_DATA.comparison.orders)}%
                              </span>
                          }
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
                  </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                  <Card>
                      <Statistic
                          title="Customers"
                          value={DASHBOARD_DATA.todayStats.customers}
                          prefix={<UserOutlined />}
                          suffix={
                              <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.customers > 0 ? '#3f8600' : '#cf1322' }}>
                                  {DASHBOARD_DATA.comparison.customers > 0 ? <RiseOutlined /> : <FallOutlined />}
                                  {Math.abs(DASHBOARD_DATA.comparison.customers)}%
                              </span>
                          }
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
                  </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                  <Card>
                      <Statistic
                          title="Avg Order Value"
                          value={DASHBOARD_DATA.todayStats.avgOrderValue}
                          precision={2}
                          prefix={currency}
                          suffix={
                              <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.avgOrderValue > 0 ? '#3f8600' : '#cf1322' }}>
                                  {DASHBOARD_DATA.comparison.avgOrderValue > 0 ? <RiseOutlined /> : <FallOutlined />}
                                  {Math.abs(DASHBOARD_DATA.comparison.avgOrderValue)}%
                              </span>
                          }
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
                  </Card>
              </Col>
          </Row>
      </Card> */}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={DASHBOARD_DATA.todayStats.revenue}
              precision={2}
              prefix={<CurrencyIcon />}
              suffix={
                <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.revenue > 0 ? '#3f8600' : '#cf1322' }}>
                  {DASHBOARD_DATA.comparison.revenue > 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(DASHBOARD_DATA.comparison.revenue)}%
                </span>
              }
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Orders"
              value={DASHBOARD_DATA.todayStats.orders}
              prefix={<ShoppingCartOutlined />}
              suffix={
                <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.orders > 0 ? '#3f8600' : '#cf1322' }}>
                  {DASHBOARD_DATA.comparison.orders > 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(DASHBOARD_DATA.comparison.orders)}%
                </span>
              }
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Customers"
              value={DASHBOARD_DATA.todayStats.customers}
              prefix={<UserOutlined />}
              suffix={
                <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.customers > 0 ? '#3f8600' : '#cf1322' }}>
                  {DASHBOARD_DATA.comparison.customers > 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(DASHBOARD_DATA.comparison.customers)}%
                </span>
              }
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Order Value"
              value={DASHBOARD_DATA.todayStats.avgOrderValue}
              precision={2}
              prefix={currency}
              suffix={
                <span style={{ fontSize: 14, color: DASHBOARD_DATA.comparison.avgOrderValue > 0 ? '#3f8600' : '#cf1322' }}>
                  {DASHBOARD_DATA.comparison.avgOrderValue > 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(DASHBOARD_DATA.comparison.avgOrderValue)}%
                </span>
              }
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>vs yesterday</div>
          </Card>
        </Col>

          {/* Left Column */}
          <Col xs={24} lg={16}>
              {/* Order Status */}
              <Card title="Order Status Overview" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                      <Col xs={12} sm={8} md={6}>
                          <Statistic
                              title="Pending"
                              value={DASHBOARD_DATA.ordersByStatus.pending}
                              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                              valueStyle={{ color: '#faad14' }}
                          />
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                          <Statistic
                              title="Processing"
                              value={DASHBOARD_DATA.ordersByStatus.processing}
                              prefix={<SyncOutlined spin style={{ color: '#1890ff' }} />}
                              valueStyle={{ color: '#1890ff' }}
                          />
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                          <Statistic
                              title="Out for Delivery"
                              value={DASHBOARD_DATA.ordersByStatus.out_for_delivery}
                              prefix={<ShoppingCartOutlined style={{ color: '#13c2c2' }} />}
                              valueStyle={{ color: '#13c2c2' }}
                          />
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                          <Statistic
                              title="Delivered"
                              value={DASHBOARD_DATA.ordersByStatus.delivered}
                              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
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
                              prefix={<CloseCircleOutlined style={{ color: '#8c8c8c' }} />}
                              valueStyle={{ color: '#8c8c8c' }}
                          />
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                          <Statistic
                              title="Declined"
                              value={DASHBOARD_DATA.ordersByStatus.declined}
                              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                              valueStyle={{ color: '#ff4d4f' }}
                          />
                      </Col>
                  </Row>
              </Card>

              {/* Revenue Chart */}
              <Card title="Revenue Overview (Last 7 Days)" style={{ marginBottom: 16 }}>
                  <div style={{ padding: '20px 0' }}>
                      <Row gutter={[8, 8]}>
                          {DASHBOARD_DATA.revenueChart.map((item, index) => (
                              <Col key={index} span={24 / 7} style={{ textAlign: 'center' }}>
                                  <div style={{ marginBottom: 8 }}>
                                      <div style={{
                                          height: `${(item.revenue / 50)}px`,
                                          backgroundColor: '#1890ff',
                                          borderRadius: '4px 4px 0 0',
                                          minHeight: '20px',
                                          marginBottom: 4
                                      }} />
                                      <div style={{ fontSize: 12, fontWeight: 'bold' }}>{currency}{(item.revenue / 1000).toFixed(1)}k</div>
                                      <div style={{ fontSize: 11, color: '#999' }}>{item.orders} orders</div>
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 'bold' }}>{item.day}</div>
                              </Col>
                          ))}
                      </Row>
                  </div>
                  <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                      <Statistic
                          title="7-Day Total"
                          value={DASHBOARD_DATA.revenueChart.reduce((sum, item) => sum + item.revenue, 0)}
                          precision={2}
                          prefix={currency}
                          valueStyle={{ fontSize: 24 }}
                      />
                  </div>
              </Card>

              {/* Recent Orders */}
              <Card title="Recent Orders" style={{ marginBottom: 16 }}>
                  <Table
                      columns={recentOrderColumns}
                      dataSource={DASHBOARD_DATA.recentOrders}
                      rowKey="id"
                      pagination={false}
                      size="small"
                  />
              </Card>

              {/* Top Selling Products */}
              <Card title="Top Selling Products" style={{ marginBottom: 16 }}>
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
              {/* This Month Summary */}
              <Card title="This Month Summary" style={{ marginBottom: 16 }}>
                  <Statistic
                      title="Total Revenue"
                      value={DASHBOARD_DATA.monthStats.revenue}
                      precision={2}
                      prefix={<CurrencyIcon style={{ top: "-4px" }} />}
                      valueStyle={{ color: '#3f8600', fontSize: 28 }}
                  />
                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                      <Col span={12}>
                          <Statistic
                              title="Orders"
                              value={DASHBOARD_DATA.monthStats.orders}
                              prefix={<ShoppingCartOutlined />}
                          />
                      </Col>
                      <Col span={12}>
                          <Statistic
                              title="Avg Order Value"
                              value={DASHBOARD_DATA.monthStats.avgOrderValue}
                              precision={2}
                              prefix={currency}
                          />
                      </Col>
                      <Col span={12}>
                          <Statistic
                              title="New Customers"
                              value={DASHBOARD_DATA.monthStats.newCustomers}
                              valueStyle={{ color: '#1890ff' }}
                          />
                      </Col>
                      <Col span={12}>
                          <Statistic
                              title="Returning"
                              value={DASHBOARD_DATA.monthStats.returningCustomers}
                              valueStyle={{ color: '#52c41a' }}
                          />
                      </Col>
                  </Row>
              </Card>

              {/* Inventory Alerts */}
              <Card
                  title={
                      <Space>
                          <WarningOutlined style={{ color: '#ff4d4f' }} />
                          Inventory Alerts
                      </Space>
                  }
                  style={{ marginBottom: 16 }}
              >
                  <List
                      size="small"
                      dataSource={DASHBOARD_DATA.inventoryAlerts}
                      renderItem={(item) => (
                          <List.Item>
                              <List.Item.Meta
                                  title={item.product}
                                  description={
                                      <Space>
                                          <span>Stock: {item.stock}</span>
                                          <Tag color={item.status === 'critical' ? 'error' : 'warning'}>
                                              {item.status.toUpperCase()}
                                          </Tag>
                                      </Space>
                                  }
                              />
                          </List.Item>
                      )}
                  />
              </Card>

              {/* Staff Performance */}
              <Card title="Staff Performance" style={{ marginBottom: 16 }}>
                  <Table
                      columns={staffColumns}
                      dataSource={DASHBOARD_DATA.staffPerformance}
                      rowKey="name"
                      pagination={false}
                      size="small"
                  />
              </Card>

              {/* Recent Activities */}
              <Card title="Recent Activities" style={{ marginBottom: 16 }}>
                  <Timeline
                      items={DASHBOARD_DATA.recentActivities.map((activity) => ({
                          children: (
                              <>
                                  <p style={{ margin: 0 }}>
                                      <strong>{activity.action}</strong>
                                  </p>
                                  <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                                      {activity.user} • {activity.time}
                                  </p>
                              </>
                          )
                      }))}
                  />
              </Card>

              {/* Customer Stats */}
              <Card title="Customer Statistics" style={{ marginBottom: 16 }}>
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
                              valueStyle={{ color: '#1890ff' }}
                          />
                      </Col>
                      <Col span={12}>
                          <Statistic
                              title="Active"
                              value={DASHBOARD_DATA.customerStats.active}
                              valueStyle={{ color: '#52c41a' }}
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
                      <Col span={24}>
                          <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
                              <div style={{ fontSize: 12, color: '#666' }}>Top Spender</div>
                              <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                                  {DASHBOARD_DATA.customerStats.top_spender.name}
                              </div>
                              <div style={{ fontSize: 14, color: '#52c41a' }}>
                                  ${currency}{DASHBOARD_DATA.customerStats.top_spender.spent.toFixed(2)}
                              </div>
                          </div>
                      </Col>
                  </Row>
              </Card>
          </Col>
      </Row>

      {/* Store Information */}
      <Card title="Store Information" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <p><strong>Address:</strong> {store.address}, {store.location?.title}</p>
            <p><strong>Code:</strong> {store.code}</p>
            <p><strong>Status:</strong> <Tag color={store.status === 'published' ? 'green' : 'orange'}>{store.status}</Tag></p>
          </Col>
          <Col xs={24} md={12}>
            <p><strong>Location:</strong> {JSON.stringify(store?.center?.coordinates)}</p>
            {store.seo_title && <p><strong>SEO Title:</strong> {store.seo_title}</p>}
          </Col>
        </Row>
      </Card>
    </Page>
  </>)
}

function Wrapper(props: any) {
    return (<StoreWrapper {...props} render={({ store, onStatusUpdate }: any) => (<StoreHome onStatusUpdate={onStatusUpdate} store={store} {...props} />)} />)
}

export default Wrapper;
