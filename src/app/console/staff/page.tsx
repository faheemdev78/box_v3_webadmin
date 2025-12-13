'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultPageSize } from '@_/configs';
// import Link from 'next/link';
import { StaffList } from './components';
import { Button, PageHeading } from '@_/components';
import { Page } from '@_/template/page';
import { PageBar, PageHeader } from '@_/template';
import { __error } from '@_/lib/consoleHelper';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';

import LIST_DATA from '@_/graphql/users/staffQuery.graphql'

const permFilter = {}
const defaultFilter = {}; // { status: 'online' }


function Users(props: any) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter },
        busy: false,
    })

    const [dataArray, set_dataArray] = useState<any | null>(null)
    const [busy, setBusy] = useState(false)

    // const [deleteStore, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }

    const [staffQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA);

    useEffect(() => {
        if (called) return;
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called])

    const fetchData = async (args: { pageSize?: number; current?: number; filter?: any } = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = args.filter ? { ...args.filter } : { ...state.filter };
        if (props.filter) Object.assign(filter, { ...props.filter })

        setState({ ...state, filter, pagination: { current } })

        const results = await staffQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify({ ...filter, ...permFilter }), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.staffQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }

    const handleDelete = ({ _id }: { _id: string }) => {
        // let results = await deleteStore(id)
        //     .then(r => (r?.data?.deleteStore))
        //     .catch(error => {
        //         console.log(__error("ERROR"), error);
        //         message.error("Invalid Response!")
        //     })

        // if (!results || results.error) {
        //     message.error((results && results?.error?.message) || "Unable to delete record")
        //     return false;
        // }

        // message.success("Record deleted")
        return;
    }

    return (<>
        <PageHeader title={"Staff"} sub={<div>{(dataArray && dataArray?.pagination?.totalDocs) || 0} records found</div>}>
            {/* <Button color="orange" type="link"><Link href={`${adminRoot}/user/new`} >Add New User</Link></Button> */}
        </PageHeader>
    
        <Page>
            <StaffList
                dataSource={dataArray?.edges || []}
                pagination={false}
                handleDelete={handleDelete}
                loading={loading}
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
