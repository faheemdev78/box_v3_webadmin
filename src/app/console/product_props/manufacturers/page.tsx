'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space, Tag } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { ManufacturerForm } from '@_/modules/manufacturers/manufacturerForm';
import { defaultPageSize } from '@_/configs';
import { PageHeader } from '@_/template';
import { __error, __yellow } from '@_/lib';

import LIST_DATA from '@_/graphql/manufacturer/manufacturersQuery.graphql'
import RECORD_DELETE from '@_/graphql/manufacturer/deleteManufacturer.graphql';

const defaultFilter = { status: 'online' }

export default function Manufacturer(props) {
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
    
    const [deleteManufacturer, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }
    
    const [manufacturersQuery, { called, loading }] = useLazyQuery(
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

        const results = await manufacturersQuery({ 
            variables: { 
                limit, 
                page: skip, 
                filter: JSON.stringify({}), // JSON.stringify(filter), 
                others: JSON.stringify({})
            },
            fetchPolicy: 'cache-and-network'
        })
            .then(r => (r?.data?.manufacturersQuery))
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
        let results = await deleteManufacturer(id)
            .then(r => (r?.data?.deleteManufacturer))
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
            title: 'Manufacturer Name',
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
        <PageHeader title="Manufacturers" 
            // onSearch={console.log}
            // searchFields={[ { label: "Field 3", value: "val-3" } ]}
        >
            <Button onClick={() => set_showForm({ show: true })} color="orange">Add New Manufacture</Button>
        </PageHeader>

        <Card styles={{ body:{ padding:0 } }}>
            <Table
                loading={loading}
                columns={columns}
                dataSource={dataArray && dataArray.edges}
                pagination={false}
            />
        </Card>
    
        <ManufacturerForm
            onClose={() => set_showForm({ show: false })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

