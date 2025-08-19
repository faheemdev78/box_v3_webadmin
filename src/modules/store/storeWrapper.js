'use client'
import React, { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Alert, Col, message, Row, Space } from 'antd';
import { Loader, StatusTag } from '@_/components';
import { adminRoot, publishStatus } from '@_/configs';
import Link from 'next/link';
import { __error } from '@_/lib/consoleHelper';
import { useParams } from 'next/navigation';
import { PageBar, PageHeader } from '@_/template';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

import GET_STORE from '@_/graphql/stores/store.graphql';
import UPDATE_STATUS from '@_/graphql/stores/editStore.graphql'

export default function StoreWrapper({ render, ...props }) {
    const { store_id } = useParams()
    // const baseUrl = `${adminRoot}/store/${store_id}`

    const [fatelError, set_fatelError] = useState(null)

    const [get_store, { loading, data, called }] = useLazyQuery(GET_STORE);
    const [editStore, edit_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    useEffect(() => {
        if (called || loading || !store_id) return;
        fetchData();
    }, [store_id])

    const fetchData = async () => {
        let resutls = await get_store({ variables: { _id: store_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.store }))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Store not found!")
            return;
        }

        return resutls;
    }

    const onStatusUpdate = async (values) => {
        let resutls = await editStore({ variables: { input: { _id: store_id, status: values.status } } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.editStore }))
            .catch(err => {
                console.log(__error("Error: "), err);
                return { error: { message: "Request Error!" } }
            })

        if (!resutls || resutls.error) {
            message.error((resutls && resutls?.error?.message) || "Unable to update product!");
            return false;
        }

        fetchData()
        return resutls.status;
    }


    if (!store_id || fatelError) return <Alert message={fatelError || "No Store ID found!"} type='error' showIcon />
    if (loading) return <Loader loading={true}>Fetching store...</Loader>
    if (!data || !data?.store?._id) return <Alert message="Store not found!" showIcon />

    return (<>
        {/* <div className='page-bar'>
            <PageBar menuArray={[
                { title: 'Baskets', href: `${baseUrl}/baskets` },
                { title: 'Banners', href: `${baseUrl}/banners` },
                // { title: 'Discount Vouchers', href: `${baseUrl}/discount_vouchers` },
                // { title: 'Offers', href: `${baseUrl}/offers` },
                // { title: 'Vendors', href: `${baseUrl}/vendors` },                
                { title: 'Geo Zones', href: `${baseUrl}/zones` },
                { title: 'Products', href: `${baseUrl}/products` },
                { title: 'Orders', href: `${baseUrl}/orders` },
                { title: 'Staff', href: `${baseUrl}/staff` },
                { title: 'Vehicles', href: `${baseUrl}/vehicles` },
                { title: 'Delivery Slots', href: `${baseUrl}/delivery_slots` },
            ]} />
        </div> */}

        {/* <PageHeader title={data.store.title} 
            sub={<>
                <StatusTag value={data.store.status} editable={true} options={publishStatus} onSubmit={onStatusUpdate} />
                <div>{data.store.code}</div>
            </>}
        >            
        </PageHeader> */}
        
        {render({ store: data.store, onStatusUpdate })}
    </>)

}