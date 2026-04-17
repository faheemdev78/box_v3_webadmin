'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react'
import { Card, Col, message, Popconfirm, Row, Space, Tag } from 'antd';
import { Button, IconButton, Loader, Table } from '@/components';
import { BrandForm } from '@/modules/brand/brandForm';
import { defaultPageSize } from '@/configs';
import { PageHeader } from '@/template';
import { __error, __yellow } from '@/lib';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import LIST_DATA from '@/graphql/brand/brandsQuery.graphql'
import RECORD_DELETE from '@/graphql/brand/deleteBrand.graphql';

const defaultFilter = { status: 'online' }


function Brands(props: any) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter },
        busy: false,
    })
    
    const [dataArray, set_dataArray] = useState<any | null>(null)
    const [showForm, set_showForm] = useState<{ show: boolean; fields: any }>({ show: false, fields: undefined })
    const [busy, setBusy] = useState(false)
    const [data, setData] = useState(null)
    
    const [deleteBrand, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }
    
    const [brandsQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'cache-and-network' });

    const fetchData = async (args: { pageSize?: number; current?: number; filter?: any } = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = { ...state.filter };
        if (args.filter) filter = { ...args.filter };
        if (props.filter) Object.assign(filter, { ...props.filter })

        setState({ ...state, filter, pagination: { current } })
        setBusy(true)

        const results = await brandsQuery({ 
            variables: { 
                limit, 
                page: skip, 
                filter: JSON.stringify({}), // JSON.stringify(filter), 
                others: JSON.stringify({})
            },
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.brandsQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }: { _id: any }) => {
        let results = await deleteBrand({ variables: { _id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.deleteBrand }))
            .catch(catchApolloError)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }

    const columns = [
        {
            title: 'Brand Name',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            align: 'center' as const,
            render: (txt: any, __: any) => (<Tag color={txt === 'online' ? 'green' : 'red'}>{txt}</Tag>)
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

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [called])

    return (<>
        <PageHeader title="Brands" 
            // onSearch={console.log}
            // searchFields={[
            //     { label: "Field 1", value: "val-1" },
            //     { label: "Field 2", value: "val-2" },
            //     { label: "Field 3", value: "val-3" },
            // ]}
        >
            <Button onClick={() => set_showForm({ show: true, fields: undefined })} color="orange">Add New Brands</Button>
        </PageHeader>

            <Card styles={{ body:{ padding:0 } }}>
                <Table
                    loading={loading}
                    columns={columns}
                    dataSource={dataArray?.edges || []}
                    pagination={false}
                />
            </Card>

        <BrandForm
            onClose={() => set_showForm({ show: false, fields: undefined })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

export default Brands;
