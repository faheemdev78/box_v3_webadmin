'use client';

import React, { useEffect, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import {
  Alert,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { Button, Loader } from '@/components';
import { Page, PageHeader } from '@/template';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { useAppSelector } from '@/rStore/hooks';
import { getSession } from '@/rStore/slices/sessionSlice';

import GET_APPS from '@/graphql/admin_push/adminPushApps.graphql';
import GET_LOGS from '@/graphql/admin_push/adminPushNotificationLogs.graphql';
import REGISTER_APP from '@/graphql/admin_push/registerAdminPushApp.graphql';
import UPDATE_APP from '@/graphql/admin_push/updateAdminPushApp.graphql';
import REMOVE_APP from '@/graphql/admin_push/removeAdminPushApp.graphql';
import SEND_PUSH from '@/graphql/admin_push/sendAdminPushNotification.graphql';

const { TextArea } = Input;

export default function NotificationsPage() {
  const session = useAppSelector(getSession);
  const isSuperAdmin = session?.user?.acc_type === 'super-admin';

  const [apps, setApps] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [sendForm] = Form.useForm();
  const [appForm] = Form.useForm();
  const [appModal, setAppModal] = useState<{ open: boolean; record?: any }>({ open: false });

  const [fetchApps, { loading: loadingApps }] = useLazyQuery(GET_APPS, { fetchPolicy: 'network-only' });
  const [fetchLogs, { loading: loadingLogs }] = useLazyQuery(GET_LOGS, { fetchPolicy: 'network-only' });
  const [registerApp, { loading: registering }] = useMutation(REGISTER_APP);
  const [updateApp, { loading: updating }] = useMutation(UPDATE_APP);
  const [removeApp] = useMutation(REMOVE_APP);
  const [sendPush, { loading: sending }] = useMutation(SEND_PUSH);

  const loadApps = async () => {
    const results = await fetchApps()
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: true,
        parseReturn: (rr: any) => rr?.data?.adminPushApps,
      }))
      .catch(catchApolloError);

    if (results?.error) {
      message.error(results.error.message);
      return;
    }
    setApps(results?.edges || []);
  };

  const loadLogs = async () => {
    const results = await fetchLogs({ variables: { limit: 50, page: 1 } })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: true,
        parseReturn: (rr: any) => rr?.data?.adminPushNotificationLogs,
      }))
      .catch(catchApolloError);

    if (results?.error) {
      message.error(results.error.message);
      return;
    }
    setLogs(results?.edges || []);
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadApps();
    loadLogs();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <Page>
        <PageHeader title="Notifications" />
        <Alert
          type="error"
          showIcon
          message="Access denied"
          description="Notification Manager is available to super admins only."
        />
      </Page>
    );
  }

  const openAppModal = (record?: any) => {
    setAppModal({ open: true, record });
    appForm.setFieldsValue(
      record
        ? {
            key: record.key,
            title: record.title,
            topic: record.topic,
            notes: record.notes,
            active: record.active !== false,
          }
        : { key: '', title: '', topic: 'app_', notes: '', active: true }
    );
  };

  const handleSaveApp = async () => {
    const values = await appForm.validateFields();
    const input = {
      ...values,
      key: String(values.key).trim().toLowerCase(),
      topic: String(values.topic).trim(),
    };

    const mutation = appModal.record ? updateApp : registerApp;
    const variables = appModal.record
      ? { input: { ...input, _id: appModal.record._id } }
      : { input };

    const results = await mutation({ variables })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr: any) => rr?.data?.[appModal.record ? 'updateAdminPushApp' : 'registerAdminPushApp'],
      }))
      .catch(catchApolloError);

    if (!results || results.error) {
      message.error(results?.error?.message || 'Unable to save app');
      return;
    }

    message.success(appModal.record ? 'App updated' : 'App registered');
    setAppModal({ open: false });
    loadApps();
  };

  const handleRemoveApp = async (_id: string) => {
    const results = await removeApp({ variables: { _id } })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr: any) => rr?.data?.removeAdminPushApp,
      }))
      .catch(catchApolloError);

    if (!results || results.error) {
      message.error(results?.error?.message || 'Unable to remove app');
      return;
    }
    message.success('App removed');
    loadApps();
  };

  const handleSend = async () => {
    const values = await sendForm.validateFields();
    if (!selectedAppIds.length) {
      message.error('Select at least one app');
      return;
    }

    const results = await sendPush({
      variables: {
        input: {
          title: values.title,
          body: values.body,
          app_ids: selectedAppIds,
          deep_link: values.deep_link || undefined,
        },
      },
    })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr: any) => rr?.data?.sendAdminPushNotification,
      }))
      .catch(catchApolloError);

    if (!results || results.error) {
      message.error(results?.error?.message || 'Failed to send notification');
      return;
    }

    message.success(results.success?.message || 'Notification sent');
    sendForm.resetFields();
    setSelectedAppIds([]);
    loadLogs();
  };

  const appColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Key', dataIndex: 'key', key: 'key' },
    { title: 'Topic', dataIndex: 'topic', key: 'topic' },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, rec: any) => (
        <Space>
          <Button size="small" onClick={() => openAppModal(rec)}>Edit</Button>
          <Popconfirm title="Remove this app channel?" onConfirm={() => handleRemoveApp(rec._id)}>
            <Button size="small" danger>Remove</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: 'When',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Apps',
      dataIndex: 'apps',
      key: 'apps',
      render: (appsList: any[]) => (appsList || []).map((a) => a.title || a.key).join(', '),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'sent' ? 'green' : status === 'partial' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_: any, rec: any) =>
        `${rec?.stats?.success || 0}/${rec?.stats?.topics || 0} topics ok`,
    },
    {
      title: 'By',
      dataIndex: ['created_by', 'name'],
      key: 'created_by',
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Notification Manager"
        sub="Super admin only — broadcast push notifications by application"
      />

      <Tabs
        items={[
          {
            key: 'send',
            label: 'Send',
            children: (
              <Card>
                {(loadingApps) && <Loader loading />}
                <Form form={sendForm} layout="vertical" onFinish={handleSend}>
                  <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                    <Input maxLength={120} placeholder="Notification title" />
                  </Form.Item>
                  <Form.Item name="body" label="Message" rules={[{ required: true }]}>
                    <TextArea rows={4} maxLength={500} placeholder="Notification body" />
                  </Form.Item>
                  <Form.Item name="deep_link" label="Deep link (optional)">
                    <Input placeholder="e.g. box://orders/123" />
                  </Form.Item>
                  <Form.Item label="Target apps" required>
                    <Checkbox.Group
                      style={{ width: '100%' }}
                      value={selectedAppIds}
                      onChange={(vals) => setSelectedAppIds(vals as string[])}
                    >
                      <Row gutter={[12, 12]}>
                        {apps.filter((a) => a.active !== false).map((app) => (
                          <Col span={8} key={app._id}>
                            <Checkbox value={app._id}>
                              {app.title} <Tag>{app.topic}</Tag>
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={sending}>
                    Send notification
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'apps',
            label: 'Apps',
            children: (
              <Card
                extra={<Button type="primary" onClick={() => openAppModal()}>Register app</Button>}
              >
                <Table
                  rowKey="_id"
                  loading={loadingApps}
                  columns={appColumns}
                  dataSource={apps}
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'logs',
            label: 'Logs',
            children: (
              <Card extra={<Button onClick={loadLogs}>Refresh</Button>}>
                <Table
                  rowKey="_id"
                  loading={loadingLogs}
                  columns={logColumns}
                  dataSource={logs}
                  expandable={{
                    expandedRowRender: (rec) => (
                      <div>
                        <div><b>Body:</b> {rec.body}</div>
                        {rec.error_summary && (
                          <div style={{ color: '#cf1322', marginTop: 8 }}>
                            <b>Errors:</b> {rec.error_summary}
                          </div>
                        )}
                      </div>
                    ),
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={appModal.record ? 'Edit app' : 'Register app'}
        open={appModal.open}
        onCancel={() => setAppModal({ open: false })}
        onOk={handleSaveApp}
        confirmLoading={registering || updating}
        destroyOnHidden
      >
        <Form form={appForm} layout="vertical">
          <Form.Item name="key" label="Key" rules={[{ required: true }]} extra="e.g. driver, client, picker">
            <Input disabled={!!appModal.record} />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="topic" label="FCM topic" rules={[{ required: true }]} extra="e.g. app_driver">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
