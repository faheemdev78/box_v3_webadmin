'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { Button, DevBlock, IconButton, Loader, Table } from '@/components';
import { ProductTypesForm } from '@/modules/product_types';
import { PageHeader } from '@/template';
import { checkApolloRequestErrors } from '@/lib/utill_apollo';

import LIST_DATA from '@/graphql/product_type/prodTypes.graphql'
import RECORD_DELETE from '@/graphql/product_type/deleteProductType.graphql';


function ProductTypesPage () {
    const [prodTypes, set_prodTypes] = useState<any[] | null>(null)
    const [showForm, set_showForm] = useState<{ show: boolean; fields: any }>({ show: false, fields: undefined })

    const [get_prodTypes, { data, called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'cache-and-network' });
    const [deleteProductType, del_details] = useMutation<any>(RECORD_DELETE); // { data, loading, error }

    useEffect(() => {
        if (called) return;
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called])

    const fetchData = async () => {
        let results = await get_prodTypes({})
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.prodTypes }))
            .catch(checkApolloRequestErrors)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_prodTypes(results)
    }

    const handleDelete = async ({ _id }: { _id: string }) => {
        let results = await deleteProductType({ variables: { _id } })
            .then(r => (r?.data?.deleteProductType))
            .catch(error => {
                console.log("ERROR", error);
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
        { title: 'Tax', width: '80px', align: 'center' as const, render: (_text: any, record: any) => !record.tax ? null : `${record?.tax?.value} ${record?.tax?.unit}` },
        { title: 'Attributes', render: (_text: any, record: any) => {
            return (<Space wrap>
                {record?.attributes?.map((o: any, i: number) => (<span key={i}>{o.title}, </span>))}
            </Space>)
        } },
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
        <PageHeader title="Product Types">
            <Button onClick={() => set_showForm({ show: true, fields: undefined })} color="orange">Add New Type</Button>
        </PageHeader>

        <Card styles={{ body:{ padding:0 } }}>
            <Table
                loading={loading}
                columns={columns}
                dataSource={prodTypes || []}
                pagination={false}
            />
        </Card>
        
        <ProductTypesForm
            onClose={() => set_showForm({ show: false, fields: undefined })}
            open={showForm.show}
            fields={showForm.fields}
            callback={() => fetchData()}
        />
    </>)

}

export default ProductTypesPage;
