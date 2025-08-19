'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultPageSize } from '@_/configs';
import Link from 'next/link';
import { UsersList } from '@_/modules/users';
import { Button, PageHeading } from '@_/components';
import { Page } from '@_/template/page';
import { PageBar, PageHeader } from '@_/template';

import LIST_DATA from '@_/graphql/users/usersQuery.graphql'
import RECORD_DELETE from '@_/graphql/stores/deleteStore.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';

const defaultFilter = { status: 'online' }


export default function Users(props) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter },
        busy: false,
    })

    const [dataArray, set_dataArray] = useState(null)
    const [busy, setBusy] = useState(false)

    const [deleteStore, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }

    const [usersQuery, { called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [props])

    const fetchData = async (args = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = { ...state.filter };
        if (args.filter) filter = { ...args.filter };
        if (props.filter) Object.assign(filter, { ...props.filter })

        setState({ ...state, filter, pagination: { current } })
        setBusy(true)

        const results = await usersQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify({}), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.usersQuery }))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Invalid response!" } }
            })

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }

    const handleDelete = async ({ _id }) => {
        let results = await deleteStore(id)
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deleteStore }))
            .catch(error => {
                console.log(__error("ERROR"), error);
                message.error("Invalid Response!")
            })

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }

    return (<>
        <PageHeader title={"Users"} sub={<div>{(dataArray && dataArray?.pagination?.totalDocs) || 0} records found</div>}>
            <Button color="orange" type="link"><Link href={`${adminRoot}/user/new`} >Add New User</Link></Button>
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

// export async function generateMetadata(_, parent) {
//     const headersList = headers();
//     const store_id = headersList.get('x-store-id');
//     return { title: `Store ${store_id}` };
// }
