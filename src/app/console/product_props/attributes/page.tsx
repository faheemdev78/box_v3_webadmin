'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, Dropdown, message, Popconfirm, Row, Space, Tag } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { ProductAttributesForm } from '@_/modules/product_attributes';
import { PageHeader } from '@_/template';

import LIST_DATA from '@_/graphql/product_attributes/productAttributes.graphql'
import RECORD_DELETE from '@_/graphql/product_type/deleteProductType.graphql';

export default function ProductAttributesPage (props) {
    const [productAttributes, set_productAttributes] = useState(null)
    const [showForm, set_showForm] = useState({ show: false, fields: undefined })

    const [get_productAttributes, { data, called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );
    const [deleteProductType, del_details] = useMutation(RECORD_DELETE); // { data, loading, error }

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [props])

    const fetchData = async () => {
        let results = await get_productAttributes({
            fetchPolicy: 'cache-and-network'
        }).then(r => (r?.data?.productAttributes))
            .catch(err => {
                console.error(err)
                return { error: { message: "Invalid response!" } }
            })

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_productAttributes(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }) => {
        let results = await deleteProductType(id)
            .then(r => (r?.data?.deleteProductType))
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
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Code', dataIndex: 'code', key: 'code' },
        // { title: 'Visible', dataIndex: 'show_in_store', render: (text) => text > 0 ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>, width: 120, align: "center" },
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
        <PageHeader title="Product Attributes" 
            // onSearch={console.log}
            // searchFields={[
            //     { label: "Field 1", value: "val-1" },
            //     { label: "Field 2", value: "val-2" },
            //     { label: "Field 3", value: "val-3" },
            // ]}
        >
            <Button onClick={() => set_showForm({ show: true })} color="orange">Add New Attribute</Button>
        </PageHeader>

        <Card styles={{ body:{ padding:0 } }}>
            <Table
                loading={loading}
                columns={columns}
                dataSource={productAttributes}
                pagination={false}
            />
        </Card>

        <ProductAttributesForm
            onClose={() => set_showForm({ show: false })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

