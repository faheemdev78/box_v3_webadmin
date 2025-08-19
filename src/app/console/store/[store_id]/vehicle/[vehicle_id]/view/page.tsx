'use client'

import React, { useState, useEffect, useRef } from 'react'
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { Alert, Card, Col, Divider, Popconfirm, Row, Space, Switch } from 'antd';
import { Button, DevBlock, GMap, IconButton, Drawer, Loader, StatusTag, Table } from '@_/components';
import StoreWrapper from '@_/modules/store/storeWrapper';
import { VehicleForm } from '@_/modules/vehicles';
import { Polygon } from '@react-google-maps/api';
import Link from 'next/link';
import { adminRoot } from '@_/configs';
import { PageHeader } from '@_/template';
import { useParams } from 'next/navigation';

import GET_RECORD from '@_/graphql/vehicles/vehicle.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';


// function VehicleDetails({ params: { vehicle_id }, store }) {
function VehicleDetails({ store }) {
    const { vehicle_id } = useParams<{ vehicle_id: string }>()

    const [thisNode, set_thisNode] = useState(null)
    const [fatelError, set_fatelError] = useState(null)
    const [showForm, set_showForm] = useState(false)

    const [getVehicle, { loading, data, called }] = useLazyQuery(GET_RECORD);

    useEffect(() => {
        if (loading || called) return;

        fetchData()
    }, [vehicle_id])

    const fetchData = async() => {
        let results = await getVehicle({ variables: { _id: vehicle_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.vehicle }))
        .catch(err=>{
            console.log(__error("Error: "), err)
            return { error:{message:"Request Error!"}}
        })

        if (!results || results.error){
            set_fatelError((results && results?.error?.message) || "Vehicle Not found!")
            return;
        }

        set_thisNode(results)
    }
    function onSuccess(){
        set_showForm(false)
        fetchData()
    }

    
    if (fatelError) return <Alert message={fatelError} type="error" showIcon />
    if (loading || (data && !thisNode)) return <Loader loading={true} />
    if (!thisNode) return <Alert message="No data found!" type='error' showIcon />

    return (<>
        <PageHeader 
            title={thisNode.title}
            sub={<Space split="|">
                <StatusTag value={thisNode.status} />
                <IconButton onClick={() => set_showForm(true)} icon="pen" size="small" />
            </Space>}
        >
            <Space split="|">
                <div>Reg# {thisNode.registration_no}</div>
                <div>Box Capicity: {thisNode.box_cpacity}</div>
            </Space>
        </PageHeader>

        <Row gutter={[10, 10]}>
            <Col span={12}><Card>
                <Divider placement="left">Zones</Divider>
                <ul style={{ marginLeft: "50px" }}>
                    {thisNode?.zones?.map((zone, i) => (<li key={i}>{zone.title}</li>))}
                </ul>
            </Card></Col>
            <Col span={12}><Card>
                <Divider>Drivers</Divider>
                <ul style={{ marginLeft: "50px" }}>
                    {thisNode?.drivers?.map((item, i) => (<li key={i}>{item.name}</li>))}
                </ul>
            </Card></Col>
        </Row>

        {/* <DevBlock obj={thisNode} /> */}

        <Drawer open={showForm} onClose={() => set_showForm(false)} title={thisNode.title} footer={false} destroyOnHidden width="100%" height={"100%"} placement='top'>
            {showForm && <VehicleForm initialValues={thisNode} store={store} onSuccess={onSuccess} />}
        </Drawer>

    </>)
}

export default function Wrapper(props) {
    return (<StoreWrapper {...props} render={({ store }) => (<VehicleDetails {...props} store={store} />)} />)
}
