'use client'
// import React from 'react'
import { DeliverySlotManager } from '@_/modules/delivery_slot';
// import StoreWrapper from '@_/modules/store/storeWrapper';
import { usePageProps } from '@_/components';

export default function Wrapper(props){
    const { store } = usePageProps()

    return <DeliverySlotManager store={store} />

    // return (<StoreWrapper {...props} render={({ store }) => (<DeliverySlotManager store={store} />)} />)
}
