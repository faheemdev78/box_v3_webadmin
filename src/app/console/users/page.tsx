'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultPageSize } from '@/configs';
import Link from 'next/link';
import { UsersList } from '@/modules/users';
import { Button, PageHeading } from '@/components';
import { Page } from '@/template/page';
import { PageBar, PageHeader } from '@/template';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { __error } from '@/lib/consoleHelper';

import LIST_DATA from '@/graphql/users/adminQuery.graphql'
// import RECORD_DELETE from '@/graphql/stores/deleteStore.graphql';

const defaultFilter = { status: 'online' }


function Users(props:any) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter },
        busy: false,
    })

    const [dataArray, set_dataArray] = useState<any>(null)
    const [busy, setBusy] = useState(false)

    // const [deleteStore, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }

    const [adminQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called) return;
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called])

    const fetchData = async (args: { pageSize?: number; current?: number; filter?: any } = {}) => {
        let limit:number = args?.pageSize || defaultPageSize;
        let current:number = args?.current || 1;
        let skip:number = limit * (current - 1);

        let filter = { ...state.filter };
        if (args.filter) filter = { ...args.filter };
        if (props.filter) Object.assign(filter, { ...props.filter })

        setState({ ...state, filter, pagination: { current } })
        setBusy(true)

        const results = await adminQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify({}), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.adminQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }

    const handleDelete = async ({ _id }: { _id: any }) => {
        alert("Account cannot be deleted");
        // let results = await deleteStore({ variables: { _id } })
        //     .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.deleteStore }))
        //     .catch(catchApolloError)

        // if (!results || results.error) {
        //     message.error((results && results?.error?.message) || "Unable to delete record")
        //     return false;
        // }

        // message.success("Record deleted")
    }

    return (<>
        <PageHeader title={"Users"} sub={<div>{(dataArray && dataArray?.pagination?.totalDocs) || 0} records found</div>}>
            {/* <Button color="orange" type="link"><Link href={`${adminRoot}/user/new`} >Add New User</Link></Button> */}
            <Link href={`${adminRoot}/user/new`}>Add New User</Link>
        </PageHeader>
    
        <Page>
            <UsersList
                dataSource={dataArray && dataArray.edges}
                pagination={false}
                handleDelete={handleDelete}
                loading={loading}
            />
        </Page>

    </>)

}

export default Users

// export async function generateMetadata(_, parent) {
//     const headersList = headers();
//     const store_id = headersList.get('x-store-id');
//     return { title: `Store ${store_id}` };
// }
