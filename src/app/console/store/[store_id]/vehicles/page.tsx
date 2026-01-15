'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Alert, Card, Col, message, Modal, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultPageSize } from '@/configs';
import Link from 'next/link';
import { VehiclesList } from '@/modules/vehicles';
import { PageHeader } from '@/template';
import { Button, usePageProps, Drawer } from '@/components';
import { Page } from '@/template/page';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { __error } from '@/lib/consoleHelper';

import LIST_DATA from '@/graphql/vehicles/vehiclesQuery.graphql'
import RECORD_DELETE from '@/graphql/vehicles/deleteVehicle.graphql';

const defaultFilter = {}; // { status: 'online' }

function Vehicles() {
    const pageProps: any = usePageProps()
    const store = pageProps?.store

    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter, "store._id": store._id },
        busy: false,
    })

    const [showDrawer, set_showDrawer] = useState(false)
    const [showModal, set_showModal] = useState(false)
    const [dataArray, set_dataArray] = useState<any>(null)

    const [deleteVehicle, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }

    const [vehiclesQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called || loading) return
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store._id, called, loading])

    const fetchData = async (args: any = {}) => {
        let limit = (args as any)?.pageSize || defaultPageSize;
        let current = (args as any)?.current || 1;
        let skip = limit * (current - 1);

        let filter = { ...state.filter, "store._id": store._id };
        if ((args as any).filter) filter = { ...(args as any).filter };
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
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.vehiclesQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }: { _id: string }) => {
        let results = await deleteVehicle({ variables: { _id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.deleteVehicle }))
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
            {/* <Button type="link" color="orange"><Link href={`${adminRoot}/store/${store._id}/vehicles/new`}>Add Vehicle</Link></Button> */}
            <Link href={`${adminRoot}/store/${store._id}/vehicles/new`}>Add Vehicle</Link>
        </PageHeader>

        <Page>
            <VehiclesList
                loading={loading}
                dataSource={dataArray && dataArray.edges}
                handleDelete={handleDelete}
                pagination={false}
            />
        </Page>


        <Drawer open={showDrawer} onClose={() => set_showDrawer(false)} placement='right' 
            styles={{
                wrapper:{
                    width: "100vw"
                }
            }}
            >
            <p>hellow orld</p>
        </Drawer>


    </>)

}

export default Vehicles;

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<Vehicles store={store} />)} />)
// }
