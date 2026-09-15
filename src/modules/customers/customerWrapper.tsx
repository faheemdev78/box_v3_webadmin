'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Alert, Card, Col, message, Row, Space } from 'antd';
import { List, Loader, StatusTag } from '@/components';
import { adminRoot, defaultDateFormat, userStatus } from '@/configs';
import { useDispatch, useSelector } from 'react-redux';
import { Page } from '@/template/page';
import { PageHeader } from '@/template';
import { useParams } from 'next/navigation';
import { catchApolloError, checkApolloRequestErrors, utcToDate } from '@/lib/utill';
import { __error } from '@/lib/consoleHelper';
import Link from 'next/link';

import GET_USER from '@/graphql/users/user.graphql';
import UPDATE_STATUS from '@/graphql/users/updateUserStatus.graphql'


export function CustomerWrapper({ render, ...props }) {
    const { user_id } = useParams()

    const [fatelError, set_fatelError] = useState(null)
    const [data, setData] = useState(null)
    const session = useSelector((state) => state.session);

    const [getUser, { loading }] = useLazyQuery(GET_USER, { fetchPolicy: "network-only" });
    const [updateUserStatus, status_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    const fetchData = useCallback(async () => {
        if (!user_id) return;
        set_fatelError(null);
        setData(null);
        let resutls = await getUser({ variables: { _id: user_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.user }))
            .catch(catchApolloError)

        if (!resutls?._id || resutls?.error) {
            set_fatelError(resutls?.error?.message || "Customer not found!")
            return;
        }

        setData(resutls)
    }, [getUser, user_id])

    const onStatusUpdate = async (values) => {
        if (!data?._id) {
            message.error("Customer data is unavailable. Please reload the profile.");
            return false;
        }

        let resutls = await updateUserStatus({ variables: { _id_user: data._id, status: values.status } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.updateUserStatus }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            message.error((resutls?.error?.message) || "Unable to update status!");
            return false;
        }

        setData((prev) => ({ ...prev, status: values.status }))
        return values.status;
    }

    useEffect(() => {
        fetchData();
    }, [fetchData])


    if (!user_id || fatelError) return <Alert title="Error fetching user" description={fatelError || "No User ID found!"} type='error' showIcon />
    if (loading || !data) return <Loader loading={true}>Fetching Customer...</Loader>

    const canEdit = true; // security.verifyRole('104.4', session.user.permissions);

    return (<>
        <PageHeader 
            title={data.name}
            sub={<div>
                <Space separator="|">
                    <div>ID: {data._id}</div>
                    <div><StatusTag value={data.status} editable={canEdit} options={userStatus} onSubmit={onStatusUpdate} /></div>
                </Space>
            </div>}
        >
            {data.createdAt && <div>Created: {utcToDate(data.createdAt).format(defaultDateFormat)}</div>}
        </PageHeader>

        <Page>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col flex="200px">
                    <List
                        size="small"
                        dataSource={[
                            { href: `/console/customer/profile/${data._id}`, label:'Customer Dashbaord' },
                            { href: `/console/customer/profile/${data._id}/addresses`, label:'Delivery Addresses' },
                        ]}
                        renderItem={(item: any) => (
                            <List.Item>
                                <Link href={item.href}>{item.label}</Link>
                            </List.Item>
                        )}
                    />
                </Col>
                <Col flex="auto">
                    {render({
                        user: data,
                        session,
                        refresh: fetchData
                    })}
                </Col>
            </Row>
        </Page>

    </>)

}
export default CustomerWrapper;
