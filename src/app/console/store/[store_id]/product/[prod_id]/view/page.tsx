'use client'

import React from 'react'
import { __error, __yellow } from '@_/lib/consoleHelper';
import { ProductWrapper } from "@_/modules/products";
import { ProductView } from '@_/modules/products';
// import StoreWrapper from '@_/modules/store/storeWrapper';
// import { useParams } from 'next/navigation';
// import { useAppSelector } from '@_/rStore/hooks';
// import { getSession } from '@_/rStore/slices/sessionSlice';
import { usePageProps } from '@_/components';

// function ViewProductFormWrapper({ product, store, session }: { 
//     product: any;
//     store: any;
//     session: any;
// }) {
//     return (<>
//         <h3>{store.title}</h3>
//         <ProductView initialValues={product} session={session} store={store} />
//     </>)
// }

export default function Wrapper(props){
    // const { prod_id, store_id } = useParams<{ prod_id: string, store_id: string }>()
    // const session = useAppSelector(getSession)
    const { store } = usePageProps()
    
    return <ProductWrapper {...props}
        render={({ product, session }: { product: any; session: any; }) => {
            return (<>
                <h3>{store.title}</h3>
                <ProductView {...props} initialValues={product} session={session} store={store} />
            </>)

            // return (<ViewProductFormWrapper {...props}
            //     store={store}
            //     product={product}
            //     session={session}
            // />);
        }}
    />

    // return (<StoreWrapper {...props} 
    //     render={({ store }: { store: any; }) => {
    //         return <ProductWrapper {...props} 
    //             render={({ product, session }: { 
    //                 product: any;
    //                 session: any;
    //             }) => {
    //                 return (<ViewProductFormWrapper {...props} 
    //                     store={store} 
    //                     product={product} 
    //                     session={session}
    //                 />);
    //             }}
    //         />
    //     }}
    // />)
}
