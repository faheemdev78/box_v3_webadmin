'use client'
import React from 'react'
import { DeliverySlotManager } from '@_/modules/delivery_slot';
import StoreWrapper from '@_/modules/store/storeWrapper';

export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<DeliverySlotManager store={store} />)} />)
}
