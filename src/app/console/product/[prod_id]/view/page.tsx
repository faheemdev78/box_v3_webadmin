'use client'

import React, { useState, useEffect, useRef } from 'react'
import { __error, __yellow } from '@_/lib/consoleHelper';
import { ProductView, ProductWrapper } from "@/modules/products";
import { Alert, Card } from 'antd';
import { DevBlock } from '@_/components';
// import { useAppSelector } from '@_/rStore/hooks';

// interface ViewProductFormWrapper_Props {
//     product, 
//     session, 
//     refresh,
// }


function ViewProductFormWrapper({ product, session, refresh, store }) {
    if (!session || !session?.user?._id) return <Alert message="Invalid user session" showIcon type='error' />

    return (<>
        <ProductView initialValues={product} session={session} store={store} refresh={refresh} />
    </>)
}

export default function Wrapper(props){
    // const store = useAppSelector(({ session }) => session.store);

    return (<ProductWrapper 
        {...props} 
        render={({ product, session, refresh, store }) => (<ViewProductFormWrapper 
            store={store}
            product={product} 
            session={session} 
            refresh={refresh} 
            {...props}
        />)}
    />)
}
