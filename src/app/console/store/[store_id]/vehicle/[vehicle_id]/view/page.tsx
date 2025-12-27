'use client'

import React, { useState, useEffect, useRef } from 'react'
import { __error } from '@/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Alert, Card, Col, Divider, Popconfirm, Row, Space, Switch } from 'antd';
import { Button, DevBlock, GMap, IconButton, Drawer, Loader, StatusTag, Table, usePageProps } from '@/components';
import { VehicleForm } from '@/modules/vehicles';
import { PageHeader } from '@/template';
import { useParams } from 'next/navigation';
import { checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_RECORD from '@/graphql/vehicles/vehicle.graphql';


// function VehicleDetails({ params: { vehicle_id }, store }) {
function VehicleDetails() {
    const { store } = usePageProps() as unknown as { store: any }

    const { vehicle_id } = useParams<{ vehicle_id: string }>()

    const [thisNode, set_thisNode] = useState<any | null>(null)
    const [fatelError, set_fatelError] = useState<string | null>(null)
    const [showForm, set_showForm] = useState(false)

    const [getVehicle, { loading, data, called }] = useLazyQuery<any>(GET_RECORD, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (loading || called) return;

        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicle_id, loading, called])

    const fetchData = async() => {
        let results = await getVehicle({ variables: { _id: vehicle_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.vehicle }))
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

    
    if (fatelError) return <Alert title="Error" description={fatelError} type="error" showIcon />
    if (loading || (data && !thisNode)) return <Loader loading={true} />
    if (!thisNode) return <Alert title="Error" description="No data found!" type='error' showIcon />

    return (<>
        <PageHeader 
            title={thisNode.title}
            sub={<Space separator="|">
                <StatusTag value={thisNode.status} options={[{ label: thisNode.status, value: thisNode.status }]} onSubmit={async() => thisNode.status} />
                <IconButton onClick={() => set_showForm(true)} icon="pen" size="small" />
            </Space>}
        >
            <Space separator="|">
                <div>Reg# {thisNode.registration_no}</div>
                <div>Box Capicity: {thisNode.box_cpacity}</div>
            </Space>
        </PageHeader>

        <Row gutter={[10, 10]}>
            <Col span={12}><Card>
                <Divider orientation="horizontal" titlePlacement="left">Zones</Divider>
                <ul style={{ marginLeft: "50px" }}>
                    {thisNode?.zones?.map((zone: any, i: number) => (<li key={i}>{zone.title}</li>))}
                </ul>
            </Card></Col>
            <Col span={12}><Card>
                <Divider>Drivers</Divider>
                <ul style={{ marginLeft: "50px" }}>
                    {thisNode?.drivers?.map((item: any, i: number) => (<li key={i}>{item.name}</li>))}
                </ul>
            </Card></Col>
        </Row>

        {/* <DevBlock obj={thisNode} /> */}

        <Drawer open={showForm} onClose={() => set_showForm(false)} title={thisNode.title} footer={false} destroyOnHidden 
            styles={{ wrapper:{ width:"100vw" } }} placement='right'>
            {showForm && <VehicleForm initialValues={thisNode} store={store} onSuccess={onSuccess} />}
        </Drawer>

    </>)
}

export default VehicleDetails;

// export default function Wrapper(props) {
//     return (<StoreWrapper {...props} render={({ store }) => (<VehicleDetails {...props} store={store} />)} />)
// }
