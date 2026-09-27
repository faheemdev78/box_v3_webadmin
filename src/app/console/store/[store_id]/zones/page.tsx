'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Breadcrumb, Col, message, Row, Space, Switch, Typography } from 'antd';
import { Button, DeleteButton, IconButton, Loader, Table, usePageProps, GMap, DevBlock } from '@/components';
import { ColumnsType } from 'antd/es/table';
import { adminRoot, defaultPageSize } from '@/configs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ZonesFilter } from '@/modules/geo_zones';
import { Page } from '@/template/page';
import { PageHeader } from '@/template';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { Polygon, InfoWindow } from '@react-google-maps/api';

import LIST_DATA from '@/graphql/geo_zone/geoZoneQuery.graphql'
import RECORD_DELETE from '@/graphql/geo_zone/deleteGeoZone.graphql';


const defaultFilter = {}; // { status: 'online' }


type ZoneType = {
    _id: string;
    title: string;
    type: string;
    status?: string;
    city: { title: string };
    polygon: { coordinates: [number, number][][] };
};

type MapApi = {
    panToCoordinates: (coordinates: ZoneType['polygon']['coordinates']) => void;
};

function ServiceZone({ center, zones, focusedZoneId, onMapReady }: {
    center?: any,
    zones: ZoneType[];
    focusedZoneId?: string | null;
    onMapReady: (api: MapApi) => void;
}) {
    const { store } = usePageProps() as unknown as { store: any }

    const router = useRouter()

    const [tooltipContent, setTooltipContent] = useState<{ title: string; description: string } | null>(null); // Content of the tooltip
    const [tooltipPosition, setTooltipPosition] = useState<{ lat: number; lng: number } | null>(null); // Position of the tooltip

    const [showDeliveryZones, set_showDeliveryZones] = useState(true)
    const [showServiceZones, set_showServiceZones] = useState(true)
    const onMapReadyRef = useRef(onMapReady);
    onMapReadyRef.current = onMapReady;

    useEffect(() => {
        if (!focusedZoneId) return;
        const zone = zones.find((item) => item._id === focusedZoneId);
        if (!zone) return;
        if (zone.type === 'delivery') set_showDeliveryZones(true);
        if (zone.type === 'service') set_showServiceZones(true);
    }, [focusedZoneId, zones]);

    const polygonOptions = (zone: ZoneType, color: string) => {
        const focused = focusedZoneId === zone._id;
        return {
            fillColor: color,
            fillOpacity: focused ? 0.45 : 0.3,
            strokeColor: color,
            strokeOpacity: 0.9,
            strokeWeight: focused ? 4 : 2,
            draggable: false,
            editable: false,
            geodesic: false,
            zIndex: focused ? 20 : 10,
        };
    };

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

        <div style={{ width: '100%', height: 'calc(100vh - 250px)', position: "relative", border:"0px solid blue" }}>
            <GMap
                zoom={12}
                style={{ borderRadius: 0 }}
                enableDrawing={false}
                onMapLoad={(api: MapApi) => onMapReadyRef.current(api)}
                center={center}
            >
                {showDeliveryZones && zones.filter((o: ZoneType) => o.type == 'delivery').map((zone: ZoneType, i: number) => (<Polygon key={i}
                    onMouseOver={(e) => handleMouseOver(e, zone)}
                    onMouseOut={handleMouseOut}
                    onClick={() => router.push(`${adminRoot}/store/${store._id}/zone/${zone._id}`)}
                    path={zone.polygon.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }))}
                    options={polygonOptions(zone, 'green')}
                />))}

                {showServiceZones && zones.filter((o: ZoneType) => o.type == 'service').map((zone: ZoneType, i: number) => (<Polygon key={i}
                    onMouseOver={(e) => handleMouseOver(e, zone)}
                    onMouseOut={handleMouseOut}
                    path={zone.polygon.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }))}
                    options={polygonOptions(zone, 'blue')}
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
    const [focusedZoneId, setFocusedZoneId] = useState<string | null>(null)
    const mapApiRef = useRef<MapApi | null>(null)

    const focusZone = (zone: ZoneType) => {
        setFocusedZoneId(zone._id);
        const coordinates = zone.polygon?.coordinates;
        if (coordinates?.length) mapApiRef.current?.panToCoordinates(coordinates);
    }

    const [deleteGeoZone, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }
    const [geoZoneQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

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
  
    const columns: ColumnsType<ZoneType> = [
        { title: 'Zone Name', dataIndex: 'title', key: 'title', render: (_: unknown, rec: ZoneType) => (
            <Typography.Link onClick={() => focusZone(rec)}>{rec.title}</Typography.Link>
        ) },
        { title: 'Type', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => (
            type === 'delivery' ? 'Delivery' : type === 'service' ? 'Service' : type
        ) },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const },
        {
            title: 'Actions', dataIndex: 'actions', width: 100, key: 'actions', align: 'right',
            render: (_text: unknown, rec: ZoneType) => {
                return (<Space>
                    <IconButton icon="pen" tooltip="Edit" href={`${adminRoot}/store/${store._id}/zone/${rec._id}`} />
                    <DeleteButton onClick={() => handleDelete(rec)} />
                </Space>)
            }
        },
    ];

    useEffect(() => {
        if (called || loading) return
        fetchData()
    }, [store._id, called, loading])

    if (loading && !dataArray) return <Loader loading={true} />

    return (<>
        <PageHeader title={`Geo Zones`}
            sub={<div><Breadcrumb items={[
                { title: <Link href={`${adminRoot}/store/${store._id}`}>{store.title}</Link> },
            ]} /></div>}
        >
            <Button color="orange" type="link"><Link href={`${adminRoot}/store/${store._id}/zone/new`}>Add New Geo Zone</Link></Button>
        </PageHeader>

        <Page>
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={10}>
                    <div style={{ maxHeight: 'calc(100vh - 220px)', height: 'calc(100vh - 220px)', overflow: 'auto' }}>
                        <style>{`.zones-page-row-active > td { background: #e6f4ff !important; }`}</style>
                        <ZonesFilter initialValues={state.filter} onUpdate={onFilterUpdate} />
                        <Table
                            // title={() => (<ZonesFilter initialValues={state.filter} onUpdate={onFilterUpdate} />)}
                            bordered
                            loading={loading}
                            columns={columns}
                            dataSource={dataArray?.edges || []}
                            pagination={false}
                            rowKey="_id"
                            rowClassName={(rec: ZoneType, index?: number) => {
                                const stripe = index !== undefined && index % 2 ? 'even_row' : 'odd_row';
                                return `table_row ${stripe}${rec._id === focusedZoneId ? ' zones-page-row-active' : ''}`;
                            }}
                        />
                    </div>
                </Col>
                <Col xs={24} lg={14}>
                    <ServiceZone
                        zones={dataArray?.edges || []}
                        focusedZoneId={focusedZoneId}
                        onMapReady={(api) => { mapApiRef.current = api }}
                        center={{ lat: store.center.coordinates[0], lng: store.center.coordinates[1] }}
                    />
                </Col>
            </Row>
        </Page>

        <DevBlock obj={store.center.coordinates} />

    </>)

}

export default StoreZones;


// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<StoreZones store={store} />)} />)
// }
