import PageProvider from '@_/components/pageProps';
import { adminRoot } from '@_/configs'
import { PageBar } from '@_/template'
import { createApolloClient } from '@_/aClient/client';

import GET_STORE from '@_/graphql/stores/store.graphql';

export default async function ConsoleLayout({ children, params }: { 
    children: React.ReactNode;
    params: { store_id: string };
}) {
    const { store_id } = await params;
    const baseUrl = `${adminRoot}/store/${store_id}`;

    const client = createApolloClient();
    const { data: { store } } = await client.query({ query: GET_STORE, variables: { _id: store_id } });
    // console.log("store: ", store)

    return (<>
        <PageProvider pageProps={{ baseUrl, store_id, store }}>
            <h3>{store.title}</h3>
            <div className='page-bar'>
                <PageBar pop_item_style={{ color:"#2D3E51" }} menuArray={[
                    { title: 'Store Dashbord', href: `${baseUrl}` },
                    { title: 'Baskets', href: `${baseUrl}/baskets` },
                    { title: 'Banners', href: `${baseUrl}/banners` },
                    // { title: 'Discount Vouchers', href: `${baseUrl}/discount_vouchers` },
                    // { title: 'Offers', href: `${baseUrl}/offers` },
                    // { title: 'Vendors', href: `${baseUrl}/vendors` },                
                    { title: 'Geo Zones', href: `${baseUrl}/zones` },
                    { title: 'Products', href: `${baseUrl}/products` },
                    { title: 'Orders', href: `${baseUrl}/orders`, //modulePermessions: '106',
                        children: [
                            { title: 'Orders List', href: `${baseUrl}/orders` },
                            // { title: 'Orders on Till', href: `${baseUrl}/orders-on-till` },
                            { title: 'Orders on Till', href: `${baseUrl}/till-verification` },
                            { title: 'Ready to Dispatch', href: `${baseUrl}/ready-to-dispatch` },
                            { title: 'Dispatched', href: `${baseUrl}/dispatched` },
                            { title: 'Cart', href: `${baseUrl}/cart` },
                        ]
                    },                    
                    { title: 'Staff', href: `${baseUrl}/staff` },
                    { title: 'Vehicles', href: `${baseUrl}/vehicles` },
                    { title: 'Delivery Slots', href: `${baseUrl}/delivery_slots` },
                ]} />
            </div>
            {children}
        </PageProvider>
    </>)
}



// 'use client'
// import { adminRoot } from '@_/configs'
// import { PageBar } from '@_/template'
// import { useParams } from 'next/navigation'
// import React from 'react'

// export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
//     const { store_id } = useParams()
//     const baseUrl = `${adminRoot}/store/${store_id}`

//     return (<>
//          <div className='page-bar'>
//             <PageBar menuArray={[
//                 { title: 'Baskets', href: `${baseUrl}/baskets` },
//                 { title: 'Banners', href: `${baseUrl}/banners` },
//                 // { title: 'Discount Vouchers', href: `${baseUrl}/discount_vouchers` },
//                 // { title: 'Offers', href: `${baseUrl}/offers` },
//                 // { title: 'Vendors', href: `${baseUrl}/vendors` },                
//                 { title: 'Geo Zones', href: `${baseUrl}/zones` },
//                 { title: 'Products', href: `${baseUrl}/products` },
//                 { title: 'Orders', href: `${baseUrl}/orders` },
//                 { title: 'Staff', href: `${baseUrl}/staff` },
//                 { title: 'Vehicles', href: `${baseUrl}/vehicles` },
//                 { title: 'Delivery Slots', href: `${baseUrl}/delivery_slots` },
//             ]} />
//         </div>
//         {children}
//     </>)
// }
