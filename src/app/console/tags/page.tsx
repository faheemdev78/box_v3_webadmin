'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { ProdTagForm } from '@_/modules/product_tags/tagForm';
import { defaultPageSize } from '@_/configs';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';

import LIST_DATA from '@_/graphql/product_tags/productTagsQuery.graphql'
import RECORD_DELETE from '@_/graphql/product_tags/deleteProductTag.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';


const defaultFilter = { status: 'online' }

export default function Tags(props) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter },
        busy: false,
    })
    
    const [dataArray, set_dataArray] = useState(null)
    const [showForm, set_showForm] = useState({ show: false, fields: undefined })
    const [busy, setBusy] = useState(false)
    const [data, setData] = useState(null)
    
    const [deleteProductTag, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }
    
    const [productTagsQuery, { called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [props])

    const fetchData = async (args={}) => {
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
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.productTagsQuery }))
            .catch(err=>{
                console.log(__error("Error: "), err)
                return { error:{message:"Invalid response!"}}
            })

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }) => {
        let results = await deleteProductTag(id)
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deleteProductTag }))
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

    const columns = [
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
            align: 'right',
            render: (text, rec) => {
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
            <Button onClick={() => set_showForm({ show: true })} color="orange">Add New Tag</Button>
        </PageHeader>

        <Page>
            <Table
                loading={loading}
                columns={columns}
                dataSource={dataArray && dataArray.edges}
                pagination={false}
            />
        </Page>

        <ProdTagForm
            onClose={() => set_showForm({ show: false })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

