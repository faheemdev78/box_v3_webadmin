'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Alert, Breadcrumb, Col, message, Popconfirm, Row, Space, Switch } from 'antd';
import { Button, DeleteButton, DevBlock, IconButton, Loader, MapComponent, Table, usePageProps, GMap } from '@/components';
import { ColumnsType } from 'antd/es/table';
import { adminRoot, defaultPageSize } from '@/configs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ZonesFilter } from '@/modules/geo_zones';
import { Page } from '@/template/page';
import { PageHeader } from '@/template';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { __error } from '@/lib/consoleHelper';
import { Polygon, InfoWindow } from '@react-google-maps/api';

import LIST_DATA from '@/graphql/geo_zone/geoZoneQuery.graphql'
import RECORD_DELETE from '@/graphql/geo_zone/deleteGeoZone.graphql';


const defaultFilter = {}; // { status: 'online' }


type ZoneType = {
    _id: string;
    title: string;
    type: string;
    city: { title: string };
    polygon: { coordinates: [number, number][][] };
};

function ServiceZone({ zones }: { zones: ZoneType[] }) {
    const { store } = usePageProps() as unknown as { store: any }

    const router = useRouter()

    const [tooltipContent, setTooltipContent] = useState<{ title: string; description: string } | null>(null); // Content of the tooltip
    const [tooltipPosition, setTooltipPosition] = useState<{ lat: number; lng: number } | null>(null); // Position of the tooltip

    const [showDeliveryZones, set_showDeliveryZones] = useState(true)
    const [showServiceZones, set_showServiceZones] = useState(true)

    const handleMouseOver = (event: any, zone: ZoneType) => {
        setTooltipPosition({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        setTooltipContent({ title: zone.title, description: `${zone.type} zone` });
    };
    const handleMouseOut = () => {
        setTooltipPosition(null); // Hide tooltip
    };


    return (<>
        <div style={{ padding: "5px 0", textAlign: "right" }}><Space size={20}>
            <Switch defaultChecked={false} onChange={set_showDeliveryZones} checked={showDeliveryZones} checkedChildren="Delivery Zones" unCheckedChildren="Delivery Zones" />
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
                {showDeliveryZones && zones.filter((o: ZoneType) => o.type == 'delivery').map((zone: ZoneType, i: number) => (<Polygon key={i}
                    onMouseOver={(e) => handleMouseOver(e, zone)}
                    onMouseOut={handleMouseOut}
                    onClick={() => router.push(`${adminRoot}/store/${store._id}/zone/${zone._id}`)}
                    path={zone.polygon.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }))}
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

                {showServiceZones && zones.filter((o: ZoneType) => o.type == 'service').map((zone: ZoneType, i: number) => (<Polygon key={i}
                    onMouseOver={(e) => handleMouseOver(e, zone)}
                    onMouseOut={handleMouseOut}
                    path={zone.polygon.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }))}
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


                {tooltipPosition && tooltipContent && (<InfoWindow position={tooltipPosition}
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



function StoreZones() {
    const { store } = usePageProps() as unknown as { store: any }

    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter, "store._id": store._id },
        busy: false,
    })
    const [dataArray, set_dataArray] = useState<any | null>(null)

    const [deleteGeoZone, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }
    const [geoZoneQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called || loading) return
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store._id, called, loading])

    const fetchData = async (args: { pageSize?: number; current?: number; filter?: any } = {}) => {
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

    async function onFilterUpdate(values: any){
        await fetchData({ filter: values })
        return false;
    }
  

    const columns: ColumnsType<any> = [
        { title: 'Zone Name', dataIndex: 'title', key: 'title', render:(__: any, rec: any) => {
            return <Link href={`${adminRoot}/store/${store._id}/zone/${rec._id}`}>{rec.title}</Link>
        } },
        { title: 'Store', dataIndex: ['store', 'title'], key: 'store' },
        { title: 'Type', dataIndex: 'type', width: '20%',
            filters: [
                { text: 'Service Area', value: 'service' },
                { text: 'Delivery Zones', value: 'delivery' },
            ],
            onFilter: (value: any, record: any) => record.type.indexOf(value as any) === 0,
            sorter: (a: any, b: any) => a.type.length - b.type.length,
            // defaultSortOrder: 'descend',
        },
        {
            title: 'city', dataIndex: ['city', 'title'], width: '20%',
            sorter: (a: any, b: any) => a.city.length - b.city.length,
            defaultSortOrder: 'descend' as const,
        },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const },
        {
            title: 'Actions', dataIndex: 'actions', width: 120, key: 'actions', align: 'right',
            render: (_text: any, rec: any) => {
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
                title={() => (<ZonesFilter initialValues={state.filter} onUpdate={onFilterUpdate} />)}
                loading={loading}
                columns={columns}
                dataSource={dataArray?.edges || []}
                pagination={false}
            />
        </Page>

    </>)

}

export default StoreZones;


// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<StoreZones store={store} />)} />)
// }
