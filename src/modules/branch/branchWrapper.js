'use client'
import React, { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Alert, Col, message, Row, Space } from 'antd';
import { Loader, StatusTag, usePageProps } from '@/components';
// import { adminRoot, publishStatus } from '@/configs';
import { __error } from '@/lib/consoleHelper';
import { useParams } from 'next/navigation';
// import { PageBar, PageHeader } from '@/template';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_STORE from '@/graphql/branches/branch.graphql';
import UPDATE_STATUS from '@/graphql/branches/editBranch.graphql'

function BranchWrapper({ render, ...props }) {
    const { branch_id: store_id } = useParams()
    // const { store } = usePageProps()
    // const baseUrl = `${adminRoot}/branch/${store_id}`

    const [fatelError, set_fatelError] = useState(null)

    const [get_store, { loading, data, called }] = useLazyQuery(GET_STORE, { fetchPolicy: "no-cache" });
    const [editStore, edit_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    const fetchData = async () => {
        let resutls = await get_store({ variables: { _id: store_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.store }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Branch not found!")
            return;
        }

        return resutls;
    }
    
    useEffect(() => {
        if (called || loading || !store_id) return;
        fetchData();
        
    }, [store_id])

    const onStatusUpdate = async (values) => {
        let resutls = await editStore({ variables: { input: { _id: store_id, status: values.status } } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.editStore }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            message.error((resutls && resutls?.error?.message) || "Unable to update product!");
            return false;
        }

        fetchData()
        return resutls.status;
    }

    if (!store_id || fatelError) return <Alert title="Error" description={fatelError || "No Branch ID found!"} type='error' showIcon />
    if (loading) return <Loader loading={true}>Fetching branch...</Loader>
    if (!data || !data?.store?._id) return <Alert title="Error" description="Branch not found!" showIcon />

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

export default BranchWrapper
