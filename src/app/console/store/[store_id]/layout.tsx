import PageProvider from '@/components/pageProps';
import { adminRoot } from '@/configs'
import { PageBar } from '@/template'
import { createApolloClient } from '@/aClient/client';
import { getServerSessionToken } from '@/lib/auth/server';

import GET_STORE from '@/graphql/stores/store.graphql';


// export default async function Layout(
//     { children, params }: LayoutProps<'/console/store/[store_id]'>
// ) {
//     const { store_id } = params;
//     return <div>{children}</div>;
// }

export default async function Layout({
    children, params,
}: {
    children: React.ReactNode;
    params: Promise<{ store_id: string }>;
}) {
    const { store_id } = await params;
    const baseUrl = `${adminRoot}/store/${store_id}`;

    const client = createApolloClient();
    const token = await getServerSessionToken();
    const { data } = await client.query<any>({
        query: GET_STORE,
        variables: { _id: store_id },
        context: { authToken: token },
    });
    const store = data?.store;
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
                            { title: 'Orders', href: `${baseUrl}/orders` },
                            // { title: 'Orders on Till', href: `${baseUrl}/orders-on-till` },
                            { title: 'Orders on Till', href: `${baseUrl}/till-verification` },
                            { title: 'Ready to Dispatch', href: `${baseUrl}/ready-to-dispatch` },
                            { title: 'Dispatched', href: `${baseUrl}/dispatched` },
                            { title: 'Carts', href: `${baseUrl}/cart` },
                        ]
                    },                    
                    { title: 'Staff', href: `${baseUrl}/staff` },
                    { title: 'Drivers', href: `${baseUrl}/drivers` },
                    { title: 'Vehicles', href: `${baseUrl}/vehicles` },
                    { title: 'Delivery Slots', href: `${baseUrl}/delivery_slots` },
                ]} />
            </div>
            {children}
        </PageProvider>
    </>)
}

