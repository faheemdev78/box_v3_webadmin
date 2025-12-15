'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react'
import { Card, Col, Dropdown, message, Popconfirm, Row, Space, Tag, TableProps, TableColumnProps } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { Button, IconButton, Loader, Table } from '@/components';
import { ProductAttributesForm } from '@/modules/product_attributes';
import { PageHeader } from '@/template';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import LIST_DATA from '@/graphql/product_attributes/productAttributes.graphql'
import RECORD_DELETE from '@/graphql/product_type/deleteProductType.graphql';

function ProductAttributesPage () {
    const [productAttributes, set_productAttributes] = useState<any[] | null>(null)
    const [showForm, set_showForm] = useState<{ show: boolean; fields?: any }>({ show: false, fields: undefined })

    const [get_productAttributes, { data, called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'cache-and-network' });
    const [deleteProductType, del_details] = useMutation<any>(RECORD_DELETE); // { data, loading, error }

    useEffect(() => {
        if (called) return;
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called])

    const fetchData = async () => {
        let results = await get_productAttributes({})
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.productAttributes }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_productAttributes(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }: { _id: any }) => {
        let results = await deleteProductType({ variables: { _id } })
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

    const columns: ColumnType<any>[] = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Code', dataIndex: 'code', key: 'code' },
        // { title: 'Visible', dataIndex: 'show_in_store', render: (text: any) => text > 0 ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>, width: 120, align: "center" },
        {
            title: 'Actions',
            dataIndex: 'actions',
            width: 120,
            key: 'actions',
            align: 'right',
            render: (text: any, rec: any) => {
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
            <Button onClick={() => set_showForm({ show: true, fields: undefined })} color="orange">Add New Attribute</Button>
        </PageHeader>

        <Card styles={{ body:{ padding:0 } }}>
            <Table
                loading={loading}
                columns={columns}
                dataSource={productAttributes || []}
                pagination={false}
            />
        </Card>

        <ProductAttributesForm
            onClose={() => set_showForm({ show: false, fields: undefined })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

export default ProductAttributesPage;
