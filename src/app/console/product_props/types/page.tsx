'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { Button, DevBlock, IconButton, Loader, Table } from '@_/components';
import { ProductTypesForm } from '@_/modules/product_types';
import { PageHeader } from '@_/template';

import LIST_DATA from '@_/graphql/product_type/prodTypes.graphql'
import RECORD_DELETE from '@_/graphql/product_type/deleteProductType.graphql';


export default function ProductTypesPage (props) {
    const [prodTypes, set_prodTypes] = useState(null)
    const [showForm, set_showForm] = useState({ show: false, fields: undefined })

    const [get_prodTypes, { data, called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );
    const [deleteProductType, del_details] = useMutation(RECORD_DELETE); // { data, loading, error }

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [props])

    const fetchData = async () => {
        let results = await get_prodTypes({
            fetchPolicy: 'cache-and-network'
        }).then(r => (r?.data?.prodTypes))
            .catch(err => {
                console.error(err)
                return { error: { message: "Invalid response!" } }
            })

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_prodTypes(results)
    }

    const handleDelete = async ({ _id }) => {
        let results = await deleteProductType(id)
            .then(r => (r?.data?.deleteProductType))
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
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Tax', width: '80px', align: 'center', render: (text, record) => !record.tax ? null : `${record?.tax?.value} ${record?.tax?.unit}` },
        { title: 'Attributes', render: (text, record) => {
            return (<Space wrap>
                {record?.attributes?.map((o, i) => (<span key={i}>{o.title}, </span>))}
            </Space>)
        } },
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
        <PageHeader title="Product Types">
            <Button onClick={() => set_showForm({ show: true })} color="orange">Add New Type</Button>
        </PageHeader>

        <Card styles={{ body:{ padding:0 } }}>
            <Table
                loading={loading}
                columns={columns}
                dataSource={prodTypes}
                pagination={false}
            />
        </Card>
        
        <ProductTypesForm
            onClose={() => set_showForm({ show: false })}
            open={showForm.show}
            fields={showForm.fields}
            callback={() => fetchData()}
        />
    </>)

}

