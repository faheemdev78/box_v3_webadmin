'use client'
import React, { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Alert, Col, message, Row, Space } from 'antd';
import { Loader, StatusTag } from '@_/components';
import { userStatus } from '@_/configs';
import Link from 'next/link';
import { __error } from '@_/lib/consoleHelper';
import { useParams } from 'next/navigation';
import { PageBar, PageHeader } from '@_/template';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';

import GET_STAFF from '@_/graphql/users/user.graphql';
import UPDATE_STATUS from '@_/graphql/users/updateUserStatus.graphql'

export function StaffWrapper({ render, ...props }) {
    const { user_id } = useParams()

    const [fatelError, set_fatelError] = useState(null)

    const [get_user, { loading, data, called }] = useLazyQuery(GET_STAFF, { fetchPolicy: "no-cache" });
    const [updateUserStatus, edit_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    useEffect(() => {
        if (called || loading || !user_id) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user_id])

    const fetchData = async () => {
        let resutls = await get_user({ variables: { _id: user_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.user }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Staff not found!")
            return;
        }

        return resutls;
    }

    const onUpdate = (data) => {
        fetchData()
    }

    const onStatusUpdate = async (values) => {
        let resutls = await updateUserStatus({ 
                variables: { 
                    _id_user: user_id,
                    status: values.status
                }
            })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.updateUserStatus }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            message.error((resutls && resutls?.error?.message) || "Unable to update user status!");
            return false;
        }

        fetchData()
        return values.status;
    }

    if (!user_id || fatelError) return <Alert message={fatelError || "No User ID found!"} type='error' showIcon />
    if (loading) return <Loader loading={true}>Fetching user...</Loader>
    if (!data || !data?.user?._id) return <Alert message="User not found!" showIcon />


    return (<>
        {/* <div className='page-bar'>
            <PageBar menuArray={[
                { title: 'Baskets', href: `${adminRoot}/store/${data.store._id}/baskets` },
                { title: 'Banners', href: `${adminRoot}/store/${data.store._id}/banners` },
            ]} />
        </div> */}

        <PageHeader title={data.user.name} 
            sub={<>
                <StatusTag value={data.user.status} editable={true} options={userStatus} onSubmit={onStatusUpdate} />
                <div>{data.user.acc_type}</div>
            </>}
        >            
            <div>{data.user.store.title}</div>
        </PageHeader>
        
        {render({ staff: data.user, onStatusUpdate, onUpdate })}
    </>)

}