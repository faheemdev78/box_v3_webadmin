'use client'

import React from 'react'
import { __error, __yellow } from '@_/lib/consoleHelper';
// import { ProductWrapper, ProductView } from "@_/modules/products";
// import StoreWrapper from '@_/modules/store/storeWrapper';

import { StaffWrapper, StaffView } from "@_/modules/staff";
import { StaffProfile } from './components';

function Wrapper(props: any){
    // const { prod_id } = useParams<{ prod_id: string }>()
    return (<StaffWrapper {...props} render={({ staff, onStatusUpdate }: { staff: any; onStatusUpdate: any }) => (<StaffProfile onStatusUpdate={onStatusUpdate} staff={staff} {...props} />)} />)
    // return (<StaffWrapper {...props} render={({ staff, onStatusUpdate }) => (<StaffView onStatusUpdate={onStatusUpdate} staff={staff} {...props} />)} />)
}

export default Wrapper;
