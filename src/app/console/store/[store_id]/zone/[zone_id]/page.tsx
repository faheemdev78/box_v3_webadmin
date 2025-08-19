'use client'

import React, { useState, useEffect, useRef } from 'react'
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { Alert, Breadcrumb, Card, Col, Divider, message, Popconfirm, Row, Space, Switch } from 'antd';
import { Button, DevBlock, GMap, IconButton, Loader, Drawer, StatusTag, Table } from '@_/components';
import StoreWrapper from '@_/modules/store/storeWrapper';
import GeoZoneForm from '@_/modules/geo_zones/zoneForm';
import { Polygon } from '@react-google-maps/api';
import Link from 'next/link';
import { adminRoot } from '@_/configs';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';
import { useParams } from 'next/navigation';


import GET_RECORD from '@_/graphql/geo_zone/geoZone.graphql';
import GEO_ZONES from '@_/graphql/geo_zone/geoZones.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';


// function EditStoreZone({ params: { zone_id }, store }) {
function EditStoreZone({ store }) {
    const { zone_id } = useParams<{ zone_id: string }>()

    const [zoneData, set_zoneData] = useState(null)
    const [fatelError, set_fatelError] = useState(null)
    const [showDeliveryZones, set_showDeliveryZones] = useState(true)
    const [showServiceZones, set_showServiceZones] = useState(true)
    const [showZoneForm, set_showZoneForm] = useState(false)
    const [relatedZones, set_relatedZones] = useState(false)
    
    const [geoZone, { loading, data, called }] = useLazyQuery(GET_RECORD);
    const [geoZones, zones_resutls] = useLazyQuery(GEO_ZONES);

    useEffect(() => {
        if (called || loading || !zone_id) return;
        fetchZone();
    }, [zone_id])

    useEffect(() => {
    }, [showServiceZones])
    
    useEffect(() => {
    }, [showDeliveryZones])

    useEffect(() => {
        if (relatedZones || !zoneData) return;
        loadRelatedZones()
    }, [zoneData])
    

    async function loadRelatedZones(){
        // geoZones({ variables: { filter: JSON.stringify({  }) } })
        const { city, store, type } = zoneData;

        let filter = {
            "city._id": city._id,
            "store._id": store._id,
            "type": type,
            _id: { $ne: zoneData._id }
        }

        let results = await geoZones({ variables: { filter: JSON.stringify(filter) } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.geoZones }))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to load related zones" } }
            })

        if (results && results.error) {
            message.error(results.error.message)
            return;
        }
        set_relatedZones(results)
        
    }

    const fetchZone = async () => {
        let resutls = await geoZone({ variables: { _id: zone_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.geoZone }))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Zone not found!")
            return;
        }

        set_zoneData({ ...resutls })
    }

    if (fatelError) return <Alert message={fatelError} type="error" showIcon />
    if (loading || (data && !zoneData)) return <Loader loading={true} />
    if (!data) return <Alert message="No data found!" type='error' showIcon />

    return (<>
        <Space split="|">
            <h1>{zoneData.title}</h1>
            <IconButton onClick={() => set_showZoneForm(true)} icon="pen" />
            <Link href={`${adminRoot}/store/${store._id}/zone/${zone_id}/delivery_slots`}>Delivery Slots</Link>
        </Space>
        <p>{zoneData.type}</p>
        <div><StatusTag value={zoneData.status} /></div>
        <p>{zoneData.city.title}</p>


        <Row gutter={[10, 20]}>
            <Col span={16}>
                <div style={{ padding:"5px 0" }} align="right"><Space size={20}>
                    <Switch defaultChecked={false} onChange={set_showDeliveryZones} checked={showDeliveryZones} checkedChildren="Delivery Zones" unCheckedChildren="Delivery Zones" />
                    <Switch defaultChecked={false} onChange={set_showServiceZones} checked={showServiceZones} checkedChildren="Service Zones" unCheckedChildren="Service Zones" />
                </Space></div>
                <h3>Display active orders on the zone</h3>
                <div style={{ width: '100%', height: 'calc(100vh - 300px)', position: "relative" }}>
                    <GMap 
                        // center={getPolygonCenter(zoneData.polygon.coordinates)}
                        onMapLoad={({ panToCoordinates }) => panToCoordinates(zoneData.polygon.coordinates)}
                        zoom={12} 
                        enableDrawing={false} 
                        staticZones={relatedZones}
                    >
                        <Polygon 
                            path={zoneData.polygon.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
                            options={{
                                fillColor: 'green', fillOpacity: 0.3,
                                strokeColor: 'green', strokeOpacity: 0.8, strokeWeight: 2,
                                clickable: false,
                                draggable: false,
                                editable: false,
                                geodesic: false,
                                zIndex: 10,
                            }}
                            // onLoad={(pol) => {
                            //     polygonsRef.current.push(pol); // Add the loaded polygon to the list
                            //     setPolygonsLoaded((prevCount) => prevCount + 1); // Increment loaded polygons count
                            // }}
                        />
                    </GMap>
                </div>
            </Col>
            <Col span={8}>
                {zoneData.type == 'delivery' && <>
                    {/* <Divider>Zones List</Divider> */}
                    {/* <Divider>Zones Vehicle List</Divider> */}
                    <Divider>Orders List</Divider>
                </>}
            </Col>

            {/* <Col span={24}>
                <Divider>Delivery Slots</Divider>
            </Col> */}
        </Row>


        <Drawer open={showZoneForm} onClose={() => set_showZoneForm(false)} title={zoneData.title} footer={false} destroyOnHidden width="100%" height={"100%"} placement='top'>
            {showZoneForm && <GeoZoneForm zone_id={zone_id} store_id={store._id} staticZones={relatedZones} />}
        </Drawer>

        {/* <Drawer open={manageDeliverySlots} onClose={() => set_manageDeliverySlots(false)} title={'Delivery Slots'} footer={false} destroyOnHidden height="100%" placement='top'>
            {manageDeliverySlots && <DeliverySlotManager zone={zoneData} store={store} />}
        </Drawer> */}

    </>)
}

function ServiceZone({ initialValues, relatedZones, store, ...props }) {
    const [showDeliveryZones, set_showDeliveryZones] = useState(true)
    const [showServiceZones, set_showServiceZones] = useState(true)

    return (<>
        <Row gutter={[10, 20]}>
            <Col span={24}>
                <div style={{ padding: "5px 0" }} align="right"><Space size={20}>
                    <Switch defaultChecked={false} onChange={set_showDeliveryZones} checked={showDeliveryZones} checkedChildren="Delivery Zones" unCheckedChildren="Delivery Zones" />
                    <Switch defaultChecked={false} onChange={set_showServiceZones} checked={showServiceZones} checkedChildren="Service Zones" unCheckedChildren="Service Zones" />
                </Space></div>
                <h3>Display active orders on the zone</h3>
                <div style={{ width: '100%', height: 'calc(100vh - 300px)', position: "relative" }}>
                    <GMap
                        // center={getPolygonCenter(initialValues.polygon.coordinates)}
                        onMapLoad={({ panToCoordinates }) => panToCoordinates(initialValues.polygon.coordinates)}
                        zoom={12}
                        enableDrawing={false}
                        staticZones={relatedZones}
                    >
                        <Polygon
                            path={initialValues.polygon.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
                            options={{
                                fillColor: 'green', fillOpacity: 0.3,
                                strokeColor: 'green', strokeOpacity: 0.8, strokeWeight: 2,
                                clickable: false,
                                draggable: false,
                                editable: false,
                                geodesic: false,
                                zIndex: 10,
                            }}
                        // onLoad={(pol) => {
                        //     polygonsRef.current.push(pol); // Add the loaded polygon to the list
                        //     setPolygonsLoaded((prevCount) => prevCount + 1); // Increment loaded polygons count
                        // }}
                        />
                    </GMap>
                </div>
            </Col>
        </Row>

    </>)
}

function DeliveryZone({ initialValues, relatedZones, store, ...props }) {
    const [showDeliveryZones, set_showDeliveryZones] = useState(true)
    const [showServiceZones, set_showServiceZones] = useState(true)

    return (<Page>
        <Row gutter={[10, 20]}>
            <Col span={16}>
                <h3>Display active orders on the zone</h3>
                <Card>
                    <div style={{ padding: "0 0 5px 0" }} align="right"><Space size={20}>
                        <Switch defaultChecked={false} onChange={set_showDeliveryZones} checked={showDeliveryZones} checkedChildren="Delivery Zones" unCheckedChildren="Delivery Zones" />
                        <Switch defaultChecked={false} onChange={set_showServiceZones} checked={showServiceZones} checkedChildren="Service Zones" unCheckedChildren="Service Zones" />
                    </Space></div>
                    <div style={{ width: '100%', height: 'calc(100vh - 300px)', position: "relative" }}>
                        <GMap
                            // center={getPolygonCenter(initialValues.polygon.coordinates)}
                            onMapLoad={({ panToCoordinates }) => panToCoordinates(initialValues.polygon.coordinates)}
                            zoom={12}
                            enableDrawing={false}
                            staticZones={relatedZones}
                        >
                            <Polygon
                                path={initialValues.polygon.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
                                options={{
                                    fillColor: 'green', fillOpacity: 0.3,
                                    strokeColor: 'green', strokeOpacity: 0.8, strokeWeight: 2,
                                    clickable: false,
                                    draggable: false,
                                    editable: false,
                                    geodesic: false,
                                    zIndex: 10,
                                }}
                            // onLoad={(pol) => {
                            //     polygonsRef.current.push(pol); // Add the loaded polygon to the list
                            //     setPolygonsLoaded((prevCount) => prevCount + 1); // Increment loaded polygons count
                            // }}
                            />
                        </GMap>
                    </div>
                </Card>
            </Col>
            <Col span={8}>
                {initialValues.type == 'delivery' && <>
                    <Divider>Delivery Zone Orders List</Divider>
                </>}
                {initialValues.type == 'service' && <>
                    <Divider>Service Zone Orders List</Divider>
                </>}
            </Col>

            {/* <Col span={24}>
                <Divider>Delivery Slots</Divider>
            </Col> */}
        </Row>
    </Page>)

}

export default function Wrapper(props){
    const { zone_id } = props.params;
    const [initialValues, set_initialValues] = useState(null)
    const [fatelError, set_fatelError] = useState(null)
    const [showZoneForm, set_showZoneForm] = useState(false)

    const [geoZone, { loading, data, called }] = useLazyQuery(GET_RECORD);
    const [geoZones, zones_resutls] = useLazyQuery(GEO_ZONES);

    useEffect(() => {
        if (called || loading || !zone_id) return;
        fetchZone();
    }, [zone_id])

    const fetchZone = async () => {
        let resutls = await geoZone({ variables: { _id: zone_id } }).then(r => (r?.data?.geoZone))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Zone not found!")
            return;
        }

        set_initialValues(resutls)
        loadRelatedZones(resutls)
    }

    async function loadRelatedZones(values) {
        // geoZones({ variables: { filter: JSON.stringify({  }) } })
        const { city, store, type, _id } = values;

        let filter = {
            "city._id": city._id,
            "store._id": store._id,
            "type": type,
            _id: { $ne: _id }
        }

        let results = await geoZones({ variables: { filter: JSON.stringify(filter) } }).then(r => (r?.data?.geoZones))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to load related zones" } }
            })

        if (results && results.error) {
            message.error(results.error.message)
            return;
        }
        // set_relatedZones(results)
        return results;
    }


    if (!zone_id) return <Alert message="Missing Zone ID" showIcon type='error' />
    if (fatelError) return <Alert message={fatelError} showIcon type='error' />
    if (loading || !initialValues || zones_resutls.loading) return <Loader loading={true} />

    return (<StoreWrapper {...props} render={({ store }) => (<>
        <PageHeader title={`${initialValues.title}`}
            sub={<>
                <Space split="|">
                    <IconButton onClick={() => set_showZoneForm(true)} icon="pen" size="small" />
                    <StatusTag value={initialValues.status} />
                    {initialValues.type == 'delivery' && <>
                        <Link href={`${adminRoot}/store/${store._id}/zone/${initialValues._id}/delivery_slots`}>Delivery Slots</Link>
                    </>}
                </Space>

                <div><Breadcrumb items={[
                    { title: <Link href={`${adminRoot}/store/${store._id}`}>{store.title}</Link> },
                    { title: <Link href={`${adminRoot}/store/${store._id}/zone/${initialValues._id}`}>{initialValues.title} ({initialValues.type})</Link> },
                    { title: initialValues.city.title },
                ]} /></div>
            </>}
        >
            <Button color="orange" type="link"><Link href={`${adminRoot}/store/${store._id}/zone/new`}>Add New Geo Zone</Link></Button>
        </PageHeader>


        {/* <Space split="|">
            <h1>{initialValues.title}</h1>
            <div>{initialValues.type}</div>
            <IconButton onClick={() => set_showZoneForm(true)} icon="pen" />
            <div><StatusTag value={initialValues.status} /></div>
            {initialValues.type == 'delivery' && <>
                <Link href={`${adminRoot}/store/${store._id}/zone/${initialValues._id}/delivery_slots`}>Delivery Slots</Link>
            </>}
        </Space> */}
        {/* <p>Location: {initialValues.city.title}</p> */}


        {initialValues.type == 'delivery' && 
            <DeliveryZone {...props} relatedZones={zones_resutls?.data?.geoZones} initialValues={initialValues} store={store} />
        }
        {initialValues.type == 'service' && 
            <ServiceZone {...props} relatedZones={zones_resutls?.data?.geoZones} initialValues={initialValues} store={store} />
        }

        <Drawer open={showZoneForm} onClose={() => set_showZoneForm(false)} title={initialValues.title} footer={false} destroyOnHidden width="100%" height={"100%"} placement='top'>
            {showZoneForm && <GeoZoneForm zone_id={zone_id} store_id={store._id} store={store} staticZones={zones_resutls?.data?.geoZones} />}
        </Drawer>

    </>)} />)

    // if (initialValues.type == 'delivery') return (<StoreWrapper {...props} render={({ store }) => (<DeliveryZone {...props} relatedZones={zones_resutls?.data?.geoZones} initialValues={initialValues} store={store} />)} />)
    // if (initialValues.type == 'service') return (<StoreWrapper {...props} render={({ store }) => (<ServiceZone {...props} relatedZones={zones_resutls?.data?.geoZones} initialValues={initialValues} store={store} />)} />)

    // return <Alert message="Zone Not found!" showIcon type='error' />

    // return (<StoreWrapper {...props} render={({ store }) => (<EditStoreZone {...props} initialValues={initialValues} store={store} />)} />)
}
