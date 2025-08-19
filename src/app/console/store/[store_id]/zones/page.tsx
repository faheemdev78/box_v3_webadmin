'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Alert, Breadcrumb, Col, message, Popconfirm, Row, Space } from 'antd';
import { Button, IconButton, Loader, Table } from '@_/components';
import { adminRoot, defaultPageSize } from '@_/configs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StoreWrapper from '@_/modules/store/storeWrapper';
import { ZonesFilter } from '@_/modules/geo_zones';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';

import LIST_DATA from '@_/graphql/geo_zone/geoZoneQuery.graphql'
import RECORD_DELETE from '@_/graphql/geo_zone/deleteGeoZone.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';

const defaultFilter = {}; // { status: 'online' }

function StoreZones({ store }) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter, "store._id": store._id },
        busy: false,
    })
    const [dataArray, set_dataArray] = useState(null)
    const [busy, setBusy] = useState(false)

    const router = useRouter()


    const [deleteGeoZone, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }

    const [geoZoneQuery, { called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (called || loading) return
        fetchData()
    }, [store._id])

    const fetchData = async (args = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = { ...state.filter };
        if (args.filter) filter = { ...args.filter };
        Object.assign(filter, { "store._id": store._id })

        setState({ ...state, filter, pagination: { current } })
        setBusy(true)

        const results = await geoZoneQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify(filter), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.geoZoneQuery }))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Invalid response!" } }
            })

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }) => {
        let results = await deleteGeoZone(id)
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deleteGeoZone }))
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

    async function onFilterUpdate(values){
        await fetchData({ filter: values })
        return false;
    }

    const columns = [
        { title: 'Zone Name', dataIndex: 'title', key: 'title', render:(__, rec) => {
            return <Link href={`${adminRoot}/store/${store._id}/zone/${rec._id}`}>{rec.title}</Link>
        } },
        { title: 'Store', dataIndex: ['store', 'title'], key: 'store' },
        {
            title: 'Type', dataIndex: 'type', width: '20%',
            filters: [
                { text: 'Service Area', value: 'service' },
                { text: 'Delivery Zones', value: 'delivery' },
            ],
            onFilter: (value, record) => record.type.indexOf(value) === 0,
            sorter: (a, b) => a.type.length - b.type.length,
            // defaultSortOrder: 'descend',
        },
        {
            title: 'city', dataIndex: ['city', 'title'], width: '20%',
            sorter: (a, b) => a.city.length - b.city.length,
            defaultSortOrder: 'descend',
        },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' },
        {
            title: 'Actions',
            dataIndex: 'actions',
            width: 120,
            key: 'actions',
            align: 'right',
            render: (text, rec) => {
                return (<Space>
                    {/* <IconButton onClick={() => router.push(`${adminRoot}/geo_zones/edit/${rec._id}`)} icon="pen" /> */}
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}>
                        <IconButton icon="trash-alt" />
                    </Popconfirm>
                </Space>)
            }
        },
    ];

    return (<>
        {/* <GeoZoneForm
            onClose={() => set_showForm({ show: false })}
            open={showForm.show}
            fields={showForm.fields}
            callback={onUpdateCallback}
        /> */}

        <PageHeader title={`Geo Zones`}
            sub={<div><Breadcrumb items={[
                { title: <Link href={`${adminRoot}/store/${store._id}`}>{store.title}</Link> },
            ]} /></div>}
        >
            <Button color="orange" type="link"><Link href={`${adminRoot}/store/${store._id}/zone/new`}>Add New Geo Zone</Link></Button>
        </PageHeader>

        <Page>
            <Table
                title={() => (<>
                    <ZonesFilter onUpdate={onFilterUpdate} />
                </>)}
                loading={loading}
                columns={columns}
                dataSource={dataArray && dataArray.edges}
                pagination={false}
            />
        </Page>

    </>)

}

export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<StoreZones store={store} />)} />)
}
