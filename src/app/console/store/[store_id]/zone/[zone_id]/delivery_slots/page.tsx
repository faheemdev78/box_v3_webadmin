'use client'
import React, { useEffect } from 'react'
import StoreWrapper from '@_/modules/store/storeWrapper'
import { DeliverySlotManager } from '@_/modules/delivery_slot'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Icon, Loader } from '@_/components';
import { Breadcrumb } from 'antd';
import Link from 'next/link';
import { adminRoot } from '@_/configs';
import { PageHeader } from '@_/template';
import { useParams } from 'next/navigation';

import GET_ZONE from '@_/graphql/geo_zone/geoZone.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';

// function ZoneDeliverySlots({ params: { zone_id }, store }) {
function ZoneDeliverySlots({ store }) {
    const { zone_id } = useParams<{ zone_id: string }>()

    const [get_geoZone, { loading, data, called }] = useLazyQuery(GET_ZONE);

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

    return (<>
        {loading && <Loader loading={true} />}
        {data && data?.geoZone?._id && <>
            {/* <Breadcrumb
                items={[
                    { title: <Link href={`${adminRoot}/store/${data.geoZone.store._id}`}>{data?.geoZone.store.title}</Link> },
                    { title: <Link href={`${adminRoot}/store/${data.geoZone.store._id}/zone/${data.geoZone._id}`}>{data?.geoZone.title}</Link> },
                    { title: "Delivery Slots" },
                ]}
            /> */}
            <DeliverySlotManager zone={data.geoZone} store={store} />
        </>}
    </>)
}

export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<ZoneDeliverySlots {...props} store={store} />)} />)
}


