'use client'

import React, { useEffect, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { useParams } from 'next/navigation';
import { Alert, Card, Col, Descriptions, Modal, Row, Space, Tag, message } from 'antd';
import { Avatar, Button, Loader, StatusTag } from '@/components';
import { Form as FinalForm } from 'react-final-form';
import { FormField, SubmitButton, rules, submitHandler } from '@/components/form';
import { UserTypeDD } from '@/components/dropdowns';
import { Page, PageHeader } from '@/template';
import { userStatus } from '@/configs';
import { PasswordUpdateButton } from '@/modules/user/components';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_USER from '@/graphql/users/user.graphql';
import EDIT_ADMIN_USER from '@/graphql/users/editAdminUser.graphql';
import UPDATE_USER_STATUS from '@/graphql/users/updateUserStatus.graphql';

function UserViewPage() {
    const { user_id } = useParams() as { user_id: string };
    const currentUserId = user_id || '';

    const [openEdit, setOpenEdit] = useState(false);
    const [fatalError, setFatalError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [getUser, { called, loading }] = useLazyQuery(GET_USER, { fetchPolicy: 'network-only' });
    const [editAdminUser] = useMutation(EDIT_ADMIN_USER);
    const [updateUserStatus] = useMutation(UPDATE_USER_STATUS);

    const fetchData = async () => {
        if (!user_id) return;

        const results = await getUser({ variables: { _id: user_id } })
            .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.user }))
            .catch(catchApolloError);

        if (!results || results?.error) {
            setFatalError((results && results?.error?.message) || 'User not found');
            return;
        }

        setUser(results);
    };

    const onStatusUpdate = async (values: { status?: string } | string | null): Promise<string | undefined> => {
        const status = typeof values === 'string' ? values : values?.status;
        const targetUserId = user?._id || currentUserId;

        if (!targetUserId || !status) return;

        const results = await updateUserStatus({ variables: { _id_user: targetUserId, status } })
            .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.updateUserStatus }))
            .catch(catchApolloError);

        if (!results || results?.error) {
            message.error((results && results?.error?.message) || 'Unable to update user status');
            return;
        }

        setUser((prev: any) => (prev ? { ...prev, status } : prev));
        return status;
    };

    const onEditSubmit = async (values: any) => {
        setFormError(null);
        const targetUserId = user?._id || currentUserId;

        if (!targetUserId) {
            message.error('Unable to resolve user id');
            return false;
        }

        const input: any = {
            _id: targetUserId,
            name: values?.name,
            email: values?.email,
            phone: values?.phone,
            acc_type: values?.acc_type,
            status: values?.status,
            notes: values?.notes,
            password: values?.password,
        };

        const results = await editAdminUser({ variables: { input } })
            .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.editAdminUser }))
            .catch(catchApolloError);

        if (!results || results?.error) {
            const errMsg = (results && results?.error?.message) || 'Unable to update user';
            setFormError(errMsg);
            message.error(errMsg);
            return false;
        }

        message.success('Profile updated');
        setOpenEdit(false);
        await fetchData();
        return false;
    };

    useEffect(() => {
        if (!user_id || called || loading) return;
        void fetchData();
    }, [user_id, called, loading]);

    if (!user_id) return <Alert title="Error" description="Missing user id" type="error" showIcon />;
    if (fatalError) return <Alert title="Error" description={fatalError} type="error" showIcon />;
    if (loading || !user) return <Loader loading={true}>Fetching user...</Loader>;

    return (<>
        <PageHeader
            title={user.name || 'User Profile'}
            sub={<Space separator="|">
                <div>ID: {user?._id || currentUserId}</div>
                <div><StatusTag value={user.status} editable={true} options={userStatus} onSubmit={onStatusUpdate} /></div>
            </Space>}
        >
            {user?.store?.title || 'No store assigned'}
        </PageHeader>

        <Page>
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card title="Profile">
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Avatar src={user.avatarUrl} size={120} />
                            <h2 style={{ marginTop: 12, marginBottom: 6 }}>{user.name || 'N/A'}</h2>
                            <Tag color={user.status === 'active' ? 'green' : 'red'}>{String(user.status || '').toUpperCase()}</Tag>
                        </div>

                        <Space orientation="vertical" style={{ width: '100%' }}>
                            <Button onClick={() => setOpenEdit(true)} block>Edit Profile</Button>
                            <PasswordUpdateButton _id={user?._id || currentUserId} query_type="updateUserPassword" />
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card title="Account Details">
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="Name">{user.name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Email">{user.email || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{user.phone || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Status">{user.status || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Type">{user.acc_type || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Group">{user.acc_group || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Store" span={2}>{user?.store?.title || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Notes" span={2}>{user.note || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>
        </Page>

        <Modal
            title="Edit User Profile"
            open={openEdit}
            footer={null}
            onCancel={() => {
                setFormError(null);
                setOpenEdit(false);
            }}
            width={700}
            destroyOnHidden
        >
            <FinalForm
                onSubmit={onEditSubmit}
                initialValues={{
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    status: user.status || 'active',
                    acc_type: user.acc_type || '',
                    notes: user.note || '',
                    password: '',
                    confirm_pwd: '',
                }}
                render={(formargs) => {
                    const { submitting, values } = formargs;
                    return (<>
                        {formError && <Alert title="Error" description={formError} type="error" showIcon style={{ marginBottom: 12 }} />}
                        <form id="user_profile_edit_form" {...submitHandler(formargs)}>
                            <Row gutter={[10, 10]}>
                                <Col xs={24} sm={12}><FormField type="text" name="name" label="Name" validate={rules.required} /></Col>
                                <Col xs={24} sm={12}><FormField type="email" name="email" label="Email" validate={[rules.required, rules.isEmail]} /></Col>
                                <Col xs={24} sm={12}><FormField type="text" name="phone" label="Phone" validate={rules.required} /></Col>
                                <Col xs={24} sm={12}><FormField type="select" name="status" label="Status" options={userStatus} validate={rules.required} /></Col>
                                <Col xs={24} sm={12}><UserTypeDD preload name="acc_type" label="Account Type" validate={rules.required} /></Col>
                                <Col xs={24} sm={12}><FormField type="password" name="password" label="Password" validate={rules.required} /></Col>
                                <Col xs={24} sm={12}><FormField type="password" name="confirm_pwd" label="Confirm Password" validate={[rules.required, rules.isEqual(values.password, 'Password missmatched')]} /></Col>
                                <Col span={24}><FormField type="textarea" name="notes" label="Notes" placeholder="Notes" /></Col>
                                <Col span={24} style={{ textAlign: 'right' }}>
                                    <Button onClick={() => setOpenEdit(false)} style={{ marginRight: 8 }}>Cancel</Button>
                                    <SubmitButton loading={submitting} label="Update Profile" color="primary" />
                                </Col>
                            </Row>
                        </form>
                    </>);
                }}
            />
        </Modal>
    </>);
}

export default UserViewPage;
