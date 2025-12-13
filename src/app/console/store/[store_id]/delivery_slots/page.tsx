'use client'
// import React from 'react'
import { DeliverySlotManager } from '@_/modules/delivery_slot';
// import StoreWrapper from '@_/modules/store/storeWrapper';
import { usePageProps } from '@_/components';

function Wrapper(){
    const { store } = usePageProps() as unknown as { store: any }

    return <DeliverySlotManager store={store} zone={null as any} />

    // return (<StoreWrapper {...props} render={({ store }) => (<DeliverySlotManager store={store} />)} />)
}

export default Wrapper;
