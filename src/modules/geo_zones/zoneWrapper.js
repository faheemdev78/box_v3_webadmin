'use client'
import React, { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Alert, Col, Row, Space } from 'antd';
import { Loader, StatusTag } from '@_/components';
import { adminRoot, publishStatus } from '@_/configs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

import GET_ZONE from '@_/graphql/geo_zone/geoZone.graphql';
import UPDATE_STATUS from '@_/graphql/geo_zone/editGeoZone.graphql'

export default function ZoneWrapper({ render, ...props }) {
    const { zone_id } = useParams()

    const [fatelError, set_fatelError] = useState(null)

    const [get_geoZone, { loading, data, called }] = useLazyQuery(GET_ZONE);
    const [editGeoZone, edit_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    useEffect(() => {
        if (called || loading || !zone_id) return;
        fetchData();
    }, [zone_id])

    const fetchData = async () => {
        let resutls = await get_geoZone({ variables: { _id: zone_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.geoZone }))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Zone not found!")
            return;
        }

        return resutls;
    }

    const onStatusUpdate = async (values) => {
        let resutls = await editGeoZone({ variables: { input: { _id: zone_id, status: values.status } } })
            .then(r => (r?.data?.editGeoZone))
            .catch(err => {
                console.log(__error("Error: "), err);
                return { error: { message: "Request Error!" } }
            })

        if (!resutls || resutls.error) {
            message.error((resutls && resutls?.error?.message) || "Unable to update product!");
            return false;
        }

        fetchData()
        return resutls.status;
    }


    if (!zone_id || fatelError) return <Alert message={fatelError || "No Zone ID found!"} type='error' showIcon />
    if (loading) return <Loader loading={true}>Fetching zone...</Loader>
    if (!data || !data?.zone?._id) return <Alert message="Zone not found!" showIcon />

    return (<>
        <Row gutter={[50, 50]} style={{ borderBottom:"1px solid black" }} align="middle">
            <Col>
                <h1>
                    {data.zone.title} 
                    <StatusTag value={data.zone.status} editable={true} options={publishStatus} onSubmit={onStatusUpdate} />
                </h1>
                <div>{data.zone.code}</div>
            </Col>
            <Col flex="auto"><Space split="|">
                {[
                    { title: 'Geo Zones', href: `${adminRoot}/store/${data.zone.store._id}/zone/${data.zone._id}` },
                ].map((item, i) => {
                    return <Link href={item.href} key={i}>{item.title}</Link>
                })}
            </Space></Col>
        </Row>

        {render({ store: data.store })}
    </>)

}