'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space, Tag } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { CategoriesForm } from '@_/modules/categories';
import { PageHeader } from '@_/template';
import { __error, __yellow } from '@_/lib';

import LIST_DATA from '@_/graphql/product_cat/productCats.graphql'
import RECORD_DELETE from '@_/graphql/product_cat/deleteProductCat.graphql';

const constructCategoryArray = (allCats, parent = null) => {
    if (!allCats) return []

    let arr = allCats.filter(o => o._id_parent_cat == parent).map(item => ({
        ...item,
        children: constructCategoryArray(allCats, item._id),
    }))

    return arr;
}


export default function CategoriesPage (props) {
    // const [productCats, set_productCats] = useState(null)
    const [showCatForm, set_showCatForm] = useState({ show: false, fields: undefined })

    const [get_productCats, { data, called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );
    const [deleteProductCat, del_details] = useMutation(RECORD_DELETE); // { data, loading, error }

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [props])

    const fetchData = async () => {
        console.log(__yellow("fetchData()"));
        
        let results = await get_productCats({ fetchPolicy: 'cache-and-network' }).then(r => (r?.data?.productCats))
            .catch(err => {
                console.error(err)
                return { error: { message: "Invalid response!" } }
            })

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No categories found!")
            return false;
        }
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }) => {
        let results = await deleteProductCat(id)
            .then(r => (r?.data?.deleteProductCat))
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
            title: 'Category Title',
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
            <Button onClick={() => set_showCatForm({ show: true })} color="orange">Add New Category</Button>
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
            onClose={() => set_showCatForm({ show: false })} 
            open={showCatForm.show} 
            fields={showCatForm.fields} 
            callback={onUpdateCallback}
        />

    </>)

}

