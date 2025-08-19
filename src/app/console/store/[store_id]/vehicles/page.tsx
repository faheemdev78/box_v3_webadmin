'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Alert, Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultPageSize } from '@_/configs';
import Link from 'next/link';
import StoreWrapper from '@_/modules/store/storeWrapper';
import { VehiclesList } from '@_/modules/vehicles';
import { PageHeader } from '@_/template';
import { Button } from '@_/components';
import { Page } from '@_/template/page';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';

import LIST_DATA from '@_/graphql/vehicles/vehiclesQuery.graphql'
import RECORD_DELETE from '@_/graphql/vehicles/deleteVehicle.graphql';

const defaultFilter = {}; // { status: 'online' }

function Vehicles({ store }) {
    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter, "store._id": store._id },
        busy: false,
    })

    const [dataArray, set_dataArray] = useState(null)

    const [deleteVehicle, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }

    const [vehiclesQuery, { called, loading }] = useLazyQuery(
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

        let filter = { ...state.filter, "store._id": store._id };
        if (args.filter) filter = { ...args.filter };
        // Object.assign(filter, { "store._id": store._id })

        setState({ ...state, filter, pagination: { current } })

        const results = await vehiclesQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify(filter), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.vehiclesQuery }))
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
        let results = await deleteVehicle(_id)
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deleteVehicle }))
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


    return (<>
        <PageHeader title="Vehicles">
            <Button type="link" color="orange"><Link href={`${adminRoot}/store/${store._id}/vehicles/new`}>Add Vehicle</Link></Button>
        </PageHeader>

        <Page>
            <VehiclesList
                loading={loading}
                dataSource={dataArray && dataArray.edges}
                handleDelete={handleDelete}
                pagination={false}
            />
        </Page>

    </>)

}

export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<Vehicles store={store} />)} />)
}
