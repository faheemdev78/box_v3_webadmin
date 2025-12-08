'use client'
import React, { useEffect, useState } from 'react'
// import StoreWrapper from '@_/modules/store/storeWrapper'
import { DeliverySlotManager } from '@_/modules/delivery_slot'
import { useLazyQuery, useMutation } from '@apollo/client';
import { DevBlock, Icon, Loader, usePageProps } from '@_/components';
import { Breadcrumb, Alert } from 'antd';
// import Link from 'next/link';
// import { adminRoot } from '@_/configs';
// import { PageHeader } from '@_/template';
import { useParams } from 'next/navigation';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';

import GET_ZONE from '@_/graphql/geo_zone/geoZone.graphql';

// function ZoneDeliverySlots({ params: { zone_id }, store }) {
function ZoneDeliverySlots() {
    const { store } = usePageProps() as unknown as { store: any }

    const [fatelError, set_fatelError] = useState(null)
    const { zone_id } = useParams<{ zone_id: string }>()

    const [get_geoZone, { loading, data, called }] = useLazyQuery(GET_ZONE, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called || loading || !zone_id) return;
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zone_id, called, loading])
    
    const fetchData = async () => {
        let resutls = await get_geoZone({ variables: { _id: zone_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.geoZone }))
            .catch(catchApolloError)

        if (resutls && resutls.error) {
            set_fatelError(resutls.error.message || "Unable to fetch zone details!")
            return;
        }

        return resutls;
    }


    return (<>
        {loading && <Loader loading={true} />}
        {fatelError && <Alert type="error" message={fatelError} showIcon />}

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

export default ZoneDeliverySlots;

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<ZoneDeliverySlots {...props} store={store} />)} />)
// }

