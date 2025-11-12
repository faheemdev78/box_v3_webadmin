'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Alert, Breadcrumb, Col, message, Popconfirm, Row, Space, Switch } from 'antd';
import { Button, DeleteButton, DevBlock, IconButton, Loader, MapComponent, Table, usePageProps, GMap } from '@_/components';
import { adminRoot, defaultPageSize } from '@_/configs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import StoreWrapper from '@_/modules/store/storeWrapper';
import { ZonesFilter } from '@_/modules/geo_zones';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';
import { Polygon, InfoWindow } from '@react-google-maps/api';


import LIST_DATA from '@_/graphql/geo_zone/geoZoneQuery.graphql'
import RECORD_DELETE from '@_/graphql/geo_zone/deleteGeoZone.graphql';

const defaultFilter = {}; // { status: 'online' }


function ServiceZone({ zones }) {
    const { store } = usePageProps()

    const router = useRouter()

    const [tooltipContent, setTooltipContent] = useState(""); // Content of the tooltip
    const [tooltipPosition, setTooltipPosition] = useState(null); // Position of the tooltip

    const [showDeliveryZones, set_showDeliveryZones] = useState(true)
    const [showServiceZones, set_showServiceZones] = useState(true)

    const handleMouseOver = (event, zone) => {
        setTooltipPosition({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        setTooltipContent({ title: zone.title, description: `${zone.type} zone` });
    };
    const handleMouseOut = () => {
        setTooltipPosition(null); // Hide tooltip
    };


    return (<>
        <div style={{ padding: "5px 0" }} align="right"><Space size={20}>
            <Switch defaultChecked={false} color="red" onChange={set_showDeliveryZones} checked={showDeliveryZones} checkedChildren="Delivery Zones" unCheckedChildren="Delivery Zones" />
            <Switch defaultChecked={false} onChange={set_showServiceZones} checked={showServiceZones} checkedChildren="Service Zones" unCheckedChildren="Service Zones" />
        </Space></div>

        <div style={{ width: '100%', height: 'calc(100vh - 300px)', position: "relative" }}>
            <GMap
                // center={getPolygonCenter(initialValues.polygon.coordinates)}
                // onMapLoad={({ panToCoordinates }) => panToCoordinates(initialValues.polygon.coordinates)}
                zoom={12}
                style={{ borderRadius: 0 }}
                enableDrawing={false}
                // staticZones={relatedZones}
            >
                {showDeliveryZones && zones.filter(o => o.type == 'delivery').map((zone, i) => (<Polygon key={i}
                    onMouseOver={(e) => handleMouseOver(e, zone)}
                    onMouseOut={handleMouseOut}
                    onClick={() => router.push(`${adminRoot}/store/${store._id}/zone/${zone._id}`)}
                    path={zone.polygon.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
                    options={{
                        fillColor: 'green', fillOpacity: 0.3,
                        strokeColor: 'green', strokeOpacity: 0.8, strokeWeight: 2,
                        // clickable: false,
                        draggable: false,
                        editable: false,
                        geodesic: false,
                        zIndex: 10,
                    }}
                />))}

                {showServiceZones && zones.filter(o => o.type == 'service').map((zone, i) => (<Polygon key={i}
                    onMouseOver={(e) => handleMouseOver(e, zone)}
                    onMouseOut={handleMouseOut}
                    path={zone.polygon.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
                    options={{
                        fillColor: 'blue', fillOpacity: 0.3,
                        strokeColor: 'blue', strokeOpacity: 0.8, strokeWeight: 2,
                        // clickable: false,
                        draggable: false,
                        editable: false,
                        geodesic: false,
                        zIndex: 10,
                    }}
                />))}


                {tooltipPosition && (<InfoWindow position={tooltipPosition}
                    options={{ pixelOffset: new window.google.maps.Size(0, -30), // Offset tooltip position
                    }}
                >
                    <div style={{ padding: "5px" }}>
                        <strong>{tooltipContent.title}</strong>
                        <div style={{ color:"#949494ff" }}>{tooltipContent.description}</div>
                    </div>
                </InfoWindow>)}

            </GMap>
        </div>
    </>)
}



export default function StoreZones() {
    const { store } = usePageProps()

    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter, "store._id": store._id },
        busy: false,
    })
    const [dataArray, set_dataArray] = useState(null)

    const [deleteGeoZone, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }
    const [geoZoneQuery, { called, loading }] = useLazyQuery(LIST_DATA, { fetchPolicy: 'network-only' });

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

        const results = await geoZoneQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify(filter), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.geoZoneQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }

    const handleDelete = async ({ _id }: {_id:string}) => {
        let results = await deleteGeoZone({ variables: { _id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.deleteGeoZone }))
            .catch(catchApolloError)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
        fetchData()
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
        { title: 'Type', dataIndex: 'type', width: '20%',
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
            title: 'Actions', dataIndex: 'actions', width: 120, key: 'actions', align: 'right',
            render: (text, rec) => {
                return (<Space>
                    <DeleteButton onClick={() => handleDelete(rec)} />
                    {/* <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}><IconButton icon="trash-alt" /></Popconfirm> */}
                </Space>)
            }
        },
    ];

    if (loading) return <Loader loading={true} />

    return (<>
        <PageHeader title={`Geo Zones`}
            sub={<div><Breadcrumb items={[
                { title: <Link href={`${adminRoot}/store/${store._id}`}>{store.title}</Link> },
            ]} /></div>}
        >
            <Button color="orange" type="link"><Link href={`${adminRoot}/store/${store._id}/zone/new`}>Add New Geo Zone</Link></Button>
        </PageHeader>

        {(dataArray && dataArray.edges) && <ServiceZone zones={dataArray.edges} />}

        <hr />

        <Page>
            <Table
                title={() => (<ZonesFilter onUpdate={onFilterUpdate} />)}
                loading={loading}
                columns={columns}
                dataSource={dataArray && dataArray.edges}
                pagination={false}
            />
        </Page>

    </>)

}

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<StoreZones store={store} />)} />)
// }
