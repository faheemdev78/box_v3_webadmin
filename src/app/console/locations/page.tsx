'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { LocationForm } from '@/modules/location/locationForm';
import { defaultPageSize } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

import LIST_DATA from '@_/graphql/location/locations.graphql'
import DELETE_REC from '@_/graphql/location/deleteLocation.graphql';
import ADD_REC from '@_/graphql/location/addLocation.graphql';
import EDIT_REC from '@_/graphql/location/editLocation.graphql';



export default function Locations(props) {
    const [showForm, set_showForm] = useState({ show: false, fields: undefined })
    const [busy, setBusy] = useState(false)
    const [data, setData] = useState(null)
    
    const [deleteLocation, del_results] = useMutation(DELETE_REC); // { data, loading, error }
    
    const [get_locations, { called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [props])

    const fetchData = async (args={}) => {
        setBusy(true)

        const results = await get_locations({ variables: { 
            filter: JSON.stringify({}),
            others: JSON.stringify({})
        } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.locations }))
            .catch(err=>{
                console.log(__error("Error: "), err)
                return { error:{message:"Invalid response!"}}
            })

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        setData(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }) => {
        let results = await deleteLocation({ variables: { _id }})
            .then(r => (r?.data?.deleteLocation))
            .catch(error => {
                console.log(__error("ERROR"), error);
                message.error("Invalid Response!")
            })

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        fetchData()
        message.success("Record deleted")
    }

    const columns = [
        { title: 'Location Name', dataIndex: 'title', key: 'title' },
        { title: 'Code', dataIndex: 'code', key: 'code', width: 100 },
        { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            align: 'center',
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
        <PageHeader title="Locations" sub={<div>{(data && data.length) || 0} records found</div>}>
            <Button onClick={() => set_showForm({ show: true })} color="orange">Add New Location</Button>
        </PageHeader>


        <Page>
            <Table
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={false}
            />
        </Page>

        <LocationForm
            onClose={() => set_showForm({ show: false, fields: undefined })}
            open={showForm.show}
            initialValues={showForm.fields}
            callback={onUpdateCallback}
        />

    </>)

}

