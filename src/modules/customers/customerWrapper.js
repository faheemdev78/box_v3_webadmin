'use client'
import React, { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Alert, Card, Col, message, Row, Space } from 'antd';
import { Loader, StatusTag } from '@_/components';
import { adminRoot, defaultDateFormat, userStatus } from '@_/configs';
import Link from 'next/link';
// import { useSession } from 'next-auth/react';
import { useDispatch, useSelector } from 'react-redux';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';
import { useParams } from 'next/navigation';
import { catchApolloError, checkApolloRequestErrors, utcToDate } from '@_/lib/utill';
import { __error } from '@_/lib/consoleHelper';

import GET_USER from '@_/graphql/users/user.graphql';
import UPDATE_STATUS from '@_/graphql/users/updateUserStatus.graphql'


export function CustomerWrapper({ render, ...props }) {
    const { user_id } = useParams()

    const [fatelError, set_fatelError] = useState(null)
    const [data, setData] = useState(null)
    const session = useSelector((state) => state.session);

    const [getUser, { loading, called }] = useLazyQuery(GET_USER);
    const [updateUserStatus, status_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    useEffect(() => {
        if (called || loading || !user_id) return;
        fetchData();
    }, [user_id])

    const fetchData = async () => {
        let resutls = await getUser({ variables: { _id: user_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.user }))
            .catch(catchApolloError)

        if (resutls.error) {
            set_fatelError(resutls?.error?.message || "Customer not found!")
            return;
        }

        setData(resutls)
        // return resutls;
    }

    const onStatusUpdate = async (values) => {
        // console.log("onStatusUpdate()", values)
        // return false;
        
        let resutls = await updateUserStatus({ variables: { _id_user: data._id, status: values.status } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.updateUserStatus }))
            .catch(catchApolloError)

        if (resutls.error) {
            message.error((resutls?.error?.message) || "Unable to update status!");
            return false;
        }

        setData((prev) => ({ ...prev, status: values.status }))
        return values.status;
    }


    // if (status == 'loading') return <Loader loading={true} />
    if (!user_id || fatelError) return <Alert message={fatelError || "No User ID found!"} type='error' showIcon />
    if (loading || !data) return <Loader loading={true}>Fetching Customer...</Loader>

    const canEdit = true; // security.verifyRole('104.4', session.user.permissions);

    return (<>
        <PageHeader 
            title={data.name}
            sub={<div>
                <Space split="|">
                    <div>ID: {data._id}</div>
                    <div><StatusTag value={data.status} editable={canEdit} options={userStatus} onSubmit={onStatusUpdate} /></div>
                </Space>
            </div>}
        >
            {data.createdAt && <div>Created: {utcToDate(data.createdAt).format(defaultDateFormat)}</div>}
        </PageHeader>

        <Page>
            {render({
                user: data,
                session,
                refresh: fetchData
            })}
        </Page>

    </>)

}
export default CustomerWrapper;

