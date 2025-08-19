'use client'
import React, { useState, useEffect } from 'react'
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { Alert, Col, Divider, message, Popconfirm, Row, Space } from 'antd';
import { Button, DevBlock, IconButton, Loader, StatusTag, Table } from '@_/components';
import { adminRoot, defaultPageSize } from '@_/configs';
import Link from 'next/link';
import { PageHeader } from '@_/template';
import { useParams } from 'next/navigation';

import LIST_DATA from '@_/graphql/geo_zone/geoZoneQuery.graphql';
import RECORD_DELETE from '@_/graphql/geo_zone/deleteGeoZone.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

const GET_STORE = gql`query store($_id: ID!) {
    store(_id: $_id) {
        _id title
    }
}`

function GeoZoneList({ store_id, ...props }){
    const [state, setState] = useState({
        pagination: { current: 1 },
        filter: { "store._id": store_id },
        busy: false,
    })
    const [listArray, set_listArray] = useState(null)
    const [busy, setBusy] = useState(false)
    
    const [geoZoneQuery, { called, loading }] = useLazyQuery(LIST_DATA); // { variables: { filter: JSON.stringify({}) } }
    const [deleteGeoZone, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }
    
    useEffect(() => {
        if (called) return;
        fetchData()
    }, [store_id])

    const fetchData = async (args = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = { ...state.filter };
        if (args.filter) filter = { ...args.filter };
        if (props.filter) Object.assign(filter, { ...props.filter })

        setState({ ...state, filter, pagination: { current } })
        setBusy(true)

        const results = await geoZoneQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify({}), // JSON.stringify(filter), 
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

        set_listArray(results)
    }

    const handleDelete = async ({ _id }) => {
        let results = await deleteGeoZone(id)
            .then(r => (r?.data?.deleteGeoZone))
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
        { title: 'Zone title', dataIndex: 'title', key: 'title', render:(___, rec) => {
            return <Link href={`${adminRoot}/stores/zone/${rec._id}`}>{rec.title}</Link>
        } },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' },
        {
            title: 'Actions',
            dataIndex: 'actions',
            width: 120,
            key: 'actions',
            align: 'right',
            render: (text, rec) => {
                return (<Space>
                    {/* <IconButton onClick={() => set_showForm({ show: true, fields: rec })} icon="pen" /> */}
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}>
                        <IconButton icon="trash-alt" />
                    </Popconfirm>
                </Space>)
            }
        },
    ];


    return (<>
        <Table
            loading={loading}
            columns={columns}
            dataSource={listArray && listArray.edges}
            pagination={false}
        />
        
        {/* <DevBlock obj={listArray} /> */}
    </>)
}


export default function StoreZones() {
    const { store_id } = useParams<{ store_id: string }>()

    const [storeData, set_storeData] = useState(null)
    const [fatelError, set_fatelError] = useState(null)

    const [get_store, { loading, data, called }] = useLazyQuery(GET_STORE);

    useEffect(() => {
        if (called || loading || !store_id) return;
        fetchZone();
    }, [store_id])

    const fetchZone = async () => {
        let resutls = await get_store({ variables: { _id: store_id } }).then(r => (r?.data?.store))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Store not found!")
            return;
        }

        set_storeData({ ...resutls })
    }

    if (fatelError) return <Alert message={fatelError} type="error" showIcon />
    if (loading || (data && !storeData)) return <Loader loading={true} />
    if (!data) return <Alert message="No data found!" type='error' showIcon />

    return (<>
        <PageHeader 
            title="Store Zones"
            sub={<div>{storeData.title}</div>}
        />

        <GeoZoneList store_id={store_id} />

    </>)
}
