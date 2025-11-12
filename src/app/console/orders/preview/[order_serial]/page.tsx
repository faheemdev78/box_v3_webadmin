'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { DevBlock, Loader, PageHeading } from '@_/components'
import { PageHeader } from '@_/template'
import { Alert } from 'antd'
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';

import ORDER from '@/graphql/order/getOrignalOrder.graphql'

export default function OrderPreview() {
    const [error, setError] = useState(null)
    const { order_serial } = useParams();

    const [getOrignalOrder, { called, loading, data }] = useLazyQuery(ORDER, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (!order_serial || called) return;
        getchData();
    }, [order_serial])

    async function getchData(){
        setError(null)
        let results = await getOrignalOrder({
            variables: {
                filter: JSON.stringify({ serial: order_serial })
            }
        }).then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.order }))
        .catch(catchApolloError)

        if (results.error) return setError(results.error)
    }

    if (loading) return <Loader loading={true} />
    if (!data) return <Alert message="Order not found!" type="error" showIcon />
    if (error) return <Alert {...error} showIcon type="error" />
    
    return (<div>
        <PageHeader title={<>Order Preview</>} sub={<div>{order_serial}</div>} />
        <DevBlock obj={data.order} />
    </div>)
}
