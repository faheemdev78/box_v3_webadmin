'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react'
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Button, IconButton, Loader, Table } from '@/components';
import { LocationForm } from '@/modules/location/locationForm';
// import { defaultPageSize } from '@/configs';
import { __error } from '@/lib/consoleHelper';
import { PageHeader } from '@/template';
import { Page } from '@/template/page';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import LIST_DATA from '@/graphql/location/locations.graphql'
import DELETE_REC from '@/graphql/location/deleteLocation.graphql';
// import ADD_REC from '@/graphql/location/addLocation.graphql';
// import EDIT_REC from '@/graphql/location/editLocation.graphql';



function Locations() {
    const [showForm, set_showForm] = useState<{ show: boolean; fields?: any }>({ show: false, fields: undefined })
    const [busy, setBusy] = useState(false)
    const [data, setData] = useState<any[] | null>(null)
    
    const [deleteLocation, del_results] = useMutation<any>(DELETE_REC); // { data, loading, error }
    
    const [get_locations, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    const fetchData = async () => {
        setBusy(true)

        const results = await get_locations({ variables: { 
            filter: JSON.stringify({}),
            others: JSON.stringify({})
        } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.locations }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        setData(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }: { _id: string }) => {
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

    const columns: ColumnsType<any> = [
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
            render: (_text: unknown, rec: any) => {
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
        <PageHeader title="Locations" sub={<div>{(data && data.length) || 0} records found</div>}>
            <Button onClick={() => set_showForm({ show: true, fields: undefined })} color="orange">Add New Location</Button>
        </PageHeader>

        <Page>
            <Table
                loading={loading}
                columns={columns}
                dataSource={data || []}
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

export default Locations;
