'use client'

import React from 'react'
import { __error, __yellow } from '@_/lib/consoleHelper';
// import { ProductWrapper, ProductView } from "@_/modules/products";
// import StoreWrapper from '@_/modules/store/storeWrapper';

import { StaffWrapper, StaffView } from "@_/modules/staff";

export default function Wrapper(props){
    // const { prod_id } = useParams<{ prod_id: string }>()
    return (<StaffWrapper {...props} render={({ staff, onStatusUpdate }) => (<StaffView onStatusUpdate={onStatusUpdate} staff={staff} {...props} />)} />)
}
