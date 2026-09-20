'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react'
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultPageSize } from '@/configs';
// import Link from 'next/link';
import { CustomerList } from '@/modules/customers';
// import { Button, PageHeading } from '@/components';
import { Page } from '@/template/page';
import { PageBar, PageHeader } from '@/template';
import { __error } from '@/lib/consoleHelper';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import DELETE_CUSTOMER from '@/graphql/users/deleteCustomer.graphql';

import LIST_DATA from '@/graphql/users/customerQuery.graphql'

const permFilter = { acc_type:"customer" }
const defaultFilter = {}; // { status: 'online' }


type FetchArgs = { pageSize?: number; current?: number; filter?: Record<string, unknown> };

function Users(props: any) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter },
        busy: false,
    })

    const [dataArray, set_dataArray] = useState<any | null>(null)
    const [busy, setBusy] = useState(false)

    const [deleteCustomer, { loading: deleting }] = useMutation<any>(DELETE_CUSTOMER);
    const deleteInFlight = useRef(false);

    const [customerQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: "network-only" });

    const fetchData = async (args: FetchArgs = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = args.filter ? { ...args.filter } : { ...state.filter };
        if (props.filter) Object.assign(filter, { ...props.filter })

        setState({ ...state, filter, pagination: { current } })

        const results = await customerQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify({ ...filter, ...permFilter }), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.customerQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }

    const handleDelete = async ({ _id }: { _id: string }) => {
        if (deleteInFlight.current) return;
        if (!_id) { message.error('Customer ID is missing. Refresh the list.'); return; }
        deleteInFlight.current = true;
        try {
            const result = await deleteCustomer({ variables: { id: _id } })
                .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.deleteCustomer }))
                .catch(catchApolloError);
            if (!result?.success || result.error) {
                message.error(result?.error?.message || 'Unable to delete customer.');
                return;
            }
            // Reflect the successful delete even if the following refresh fails.
            set_dataArray((previous: any) => previous ? {
                ...previous,
                edges: previous.edges?.filter((customer: { _id: string }) => customer._id !== _id),
                pagination: { ...previous.pagination, totalDocs: Math.max(0, (previous.pagination?.totalDocs || 0) - 1) },
            } : previous);
            message.success('Customer deleted.');
            await fetchData({ current: state.pagination.current });
        } finally {
            deleteInFlight.current = false;
        }
    }

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [called])

    return (<>
        <PageHeader title={"Customers"} sub={<div>{(dataArray && dataArray?.pagination?.totalDocs) || 0} records found</div>}>
            {/* <Button color="orange" type="link"><Link href={`${adminRoot}/user/new`} >Add New User</Link></Button> */}
        </PageHeader>
    
        <Page>
            <CustomerList
                dataSource={dataArray && dataArray.edges}
                pagination={false}
                handleDelete={handleDelete}
                loading={loading || deleting}
            />
        </Page>

    </>)

}
export default Users;

// export async function generateMetadata(_, parent) {
//     const headersList = headers();
//     const store_id = headersList.get('x-store-id');
//     return { title: `Store ${store_id}` };
// }
