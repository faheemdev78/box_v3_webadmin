'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { ProdTagForm } from '@_/modules/product_tags/tagForm';
import { defaultPageSize } from '@_/configs';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';

import LIST_DATA from '@_/graphql/product_tags/productTagsQuery.graphql'
import RECORD_DELETE from '@_/graphql/product_tags/deleteProductTag.graphql';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';
import { ColumnsType } from 'antd/es/table';


const defaultFilter = { status: 'online' }

function Tags(props:any) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter },
        busy: false,
    })
    
    const [dataArray, set_dataArray] = useState<any>(null)
    const [showForm, set_showForm] = useState({ show: false, fields: undefined })
    const [busy, setBusy] = useState(false)
    const [data, setData] = useState(null)
    
    const [deleteProductTag, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }
    
    const [productTagsQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called) return;
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called])

    const fetchData = async (args: { pageSize?: number; current?: number; filter?: any } = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = { ...state.filter };
        if (args.filter) filter = { ...args.filter };
        if (props.filter) Object.assign(filter, { ...props.filter })

        setState({ ...state, filter, pagination: { current } })
        setBusy(true)

        const results = await productTagsQuery({ variables: { 
            limit, 
            page: skip, 
            filter: JSON.stringify({}), // JSON.stringify(filter), 
            others: JSON.stringify({})
        } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.productTagsQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }: { _id: string }) => {
        let results = await deleteProductTag({ variables: { _id }})
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.deleteProductTag }))
            .catch(catchApolloError)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }

    const columns: ColumnsType<any> = [
        {
            title: 'Tag',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            width: 120,
            key: 'actions',
            align: 'right' as const,
            render: (_text: any, rec: any) => {
                return (<Space>
                    <IconButton onClick={() => set_showForm({ show: true, fields: rec })} icon="pen" />
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}>
                        <IconButton icon="trash-alt" />
                    </Popconfirm>
                </Space>)
            }
        },
    ];

    return (<>
        <PageHeader title="Product Tags" sub={<div>
            {(dataArray && dataArray.pagination.totalDocs) || 0} records found
        </div>}>
            <Button onClick={() => set_showForm({ show: true, fields: undefined })} color="orange">Add New Tag</Button>
        </PageHeader>

        <Page>
            <Table
                loading={loading}
                columns={columns}
                dataSource={dataArray?.edges || []}
                pagination={false}
            />
        </Page>

        <ProdTagForm
            onClose={() => set_showForm({ show: false, fields: undefined })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

export default Tags
