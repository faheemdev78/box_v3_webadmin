'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space, Tag } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { BrandForm } from '@_/modules/brand/brandForm';
import { defaultPageSize } from '@_/configs';
import { PageHeader } from '@_/template';
import { __error, __yellow } from '@_/lib';

import LIST_DATA from '@_/graphql/brand/brandsQuery.graphql'
import RECORD_DELETE from '@_/graphql/brand/deleteBrand.graphql';

const defaultFilter = { status: 'online' }


export default function Brands(props) {
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
    
    const [deleteBrand, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }
    
    const [brandsQuery, { called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [props])

    const fetchData = async (args={}) => {
        let limit:Number = args?.pageSize || defaultPageSize;
        let current: Number = args?.current || 1;
        let skip: Number = limit * (current - 1);

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
            fetchPolicy: 'cache-and-network'
        })
            .then(r => (r?.data?.brandsQuery))
            .catch(err=>{
                console.error(err)
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
        let results = await deleteBrand(id)
            .then(r => (r?.data?.deleteBrand))
            .catch(error => {
                console.error(error);
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
            title: 'Brand Name',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            align: 'center',
            render: (txt, __) => (<Tag color={txt === 'online' ? 'green' : 'red'}>{txt}</Tag>)
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
        <PageHeader title="Brands" 
            // onSearch={console.log}
            // searchFields={[
            //     { label: "Field 1", value: "val-1" },
            //     { label: "Field 2", value: "val-2" },
            //     { label: "Field 3", value: "val-3" },
            // ]}
        >
            <Button onClick={() => set_showForm({ show: true })} color="orange">Add New Brands</Button>
        </PageHeader>

            <Card styles={{ body:{ padding:0 } }}>
                <Table
                    loading={loading}
                    columns={columns}
                    dataSource={dataArray && dataArray.edges}
                    pagination={false}
                />
            </Card>

        <BrandForm
            onClose={() => set_showForm({ show: false })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

