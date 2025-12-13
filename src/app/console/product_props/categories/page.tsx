'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react'
import { Card, Col, message, Popconfirm, Row, Space, Tag } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { CategoriesForm } from '@_/modules/categories';
import { PageHeader } from '@_/template';
import { __error, __yellow } from '@_/lib';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';

import LIST_DATA from '@_/graphql/product_cat/productCats.graphql'
import RECORD_DELETE from '@_/graphql/product_cat/deleteProductCat.graphql';

const constructCategoryArray = (allCats:any, parent: any = null) => {
    if (!allCats) return []

    let arr = allCats.filter((o:any) => o._id_parent_cat == parent).map((item:any) => ({
        ...item,
        children: constructCategoryArray(allCats, item._id),
    }))

    return arr;
}


function CategoriesPage () {
    // const [productCats, set_productCats] = useState(null)
    const [showCatForm, set_showCatForm] = useState<{ show: boolean; fields: any }>({ show: false, fields: undefined })

    const [get_productCats, { data, called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'cache-and-network' });
    const [deleteProductCat, del_details] = useMutation<any>(RECORD_DELETE); // { data, loading, error }

    useEffect(() => {
        if (called) return;
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called])

    const fetchData = async () => {
        console.log(__yellow("fetchData()"));
        
        let results = await get_productCats()
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.productCats }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No categories found!")
            return false;
        }
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }: { _id: string }) => {
        let results = await deleteProductCat({ variables: { _id }})
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.deleteProductCat }))
            .catch(catchApolloError)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }

    const columns = [
        {
            title: 'Category Title',
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
                    <IconButton onClick={() => set_showCatForm({ show: true, fields: rec })} icon="pen" />
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}>
                        <IconButton icon="trash-alt" />
                    </Popconfirm>
                </Space>)
            }
        },
    ];

    return (<>
        <PageHeader title="Product Categories" 
            // onSearch={console.log}
            // searchFields={[
            //     { label: "Field 1", value: "val-1" },
            //     { label: "Field 2", value: "val-2" },
            //     { label: "Field 3", value: "val-3" },
            // ]}
        >
            <Button onClick={() => set_showCatForm({ show: true, fields: undefined })} color="orange">Add New Category</Button>
        </PageHeader>

        <Card styles={{ body:{ padding:0 } }}>
            <Table
                loading={loading}
                columns={columns}
                dataSource={constructCategoryArray(data && data.productCats)}
                pagination={false}
            />
        </Card>


        <CategoriesForm 
            onClose={() => set_showCatForm({ show: false, fields: undefined })} 
            open={showCatForm.show} 
            fields={showCatForm.fields} 
            callback={onUpdateCallback}
        />

    </>)

}

export default CategoriesPage;
