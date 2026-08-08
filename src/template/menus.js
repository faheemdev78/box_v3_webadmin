import { adminRoot } from "@/configs"


export const topMenuArray = [
    { title: 'Dashboard', href: `${adminRoot}/dashboard` },
    { title: 'Products', href: `${adminRoot}/products`, modulePermessions: '104',
        children: [
            { title: 'Catelogue', href: `${adminRoot}/products/list`, rolePermessions: "104.0" },
            { title: 'Attributes', href: `${adminRoot}/product_props/attributes`, rolePermessions: "104.1" },
            { title: 'Product Types', href: `${adminRoot}/product_props/types`, rolePermessions: '104.2' },
            { title: 'Categories', href: `${adminRoot}/product_props/categories`, rolePermessions: '104.6' },
            { title: 'Manufacturer', href: `${adminRoot}/product_props/manufacturers`, rolePermessions: '104.10' },
            { title: 'Brands', href: `${adminRoot}/product_props/brands`, rolePermessions: '104.9' },
            { title: 'Product Fields', href: `${adminRoot}/product_props/fields`, rolePermessions: '104.8' },
        ]
    },
    // { title: 'Orders', href: `${adminRoot}/orders`, modulePermessions: '106',
    //     children: [
    //         { title: 'Orders', href: `${adminRoot}/orders`, modulePermessions: '106' },
    //         // { title: 'Orders on Till', href: `${adminRoot}/orders-on-till`, rolePermessions: '104.1' },
    //         // { title: 'Ready to Dispatch', href: `${adminRoot}/ready-to-dispatch`, rolePermessions: '104.1' },
    //         // { title: 'Dispatched', href: `${adminRoot}/dispatched`, rolePermessions: '104.1' },
    //         { title: 'Carts', href: `${adminRoot}/cart`, rolePermessions: '104.1' },
    //     ]
    // },
    { title: 'Stores', href: `${adminRoot}/stores`, rolePermessions: "103.0",
        children: [
            // { title: 'Baskets', href: `${adminRoot}/store/{ID}/baskets` },
            // { title: 'Banners', href: `${adminRoot}/store/{ID}/banners` },
            // { title: 'Delivery Slots', href: `${adminRoot}/store/{ID}/delivery_slots` },
            // { title: 'Discount Vouchers', href: `${adminRoot}/store/{ID}/discount_vouchers` },
            // { title: 'Offers', href: `${adminRoot}/store/{ID}/offers` },
            // { title: 'Staff', href: `${adminRoot}/store/{ID}/staff` },
            // { title: 'Vehicles', href: `${adminRoot}/store/{ID}/vehicles` },
            // { title: 'Vendors', href: `${adminRoot}/store/{ID}/vendors` },
        ]
    },
    { title: 'Composer', href: `${adminRoot}/composer/pages`, modulePermessions: '1000',
        // children: [
        //     { title: 'Components', href: `${adminRoot}/composer/components`, rolePermessions: '1000.3' },
        //     { title: 'Pages', href: `${adminRoot}/composer/pages` },
        // ]
    },

    {
        title: 'More', //href: "#",
        children: [
            { title: 'Settings', href: `${adminRoot}/settings`, rolePermessions: '900.6' },
            { title: 'Users', href: `${adminRoot}/users`, rolePermessions: '100.0' }, // modulePermessions
            { title: 'Locations', href: `${adminRoot}/locations`, rolePermessions: '900.1' },
            { title: 'Tags', href: `${adminRoot}/tags`, rolePermessions: '900.4' },
            { title: 'Customers', href: `${adminRoot}/customer`, rolePermessions: '1002.1' },
            // { title: 'Staff', href: `${adminRoot}/staff`, rolePermessions: '100.10' },
            { title: 'Vouchers', href: `${adminRoot}/vouchers`, rolePermessions: '1003.1' },
            { title: 'Notifications', href: `${adminRoot}/notifications`, superAdminOnly: true },
            // { title: 'View Manager', href: `${adminRoot}/view_manager`, modulePermessions: '1004' },
        ]
    },
]

export const store_topMenuArray = ({ baseUrl="" }) => ([
    { title: 'Dashbord', href: `${baseUrl}` },
    // { title: 'Discount Vouchers', href: `${baseUrl}/discount_vouchers` },
    // { title: 'Offers', href: `${baseUrl}/offers` },
    // { title: 'Vendors', href: `${baseUrl}/vendors` },
    { title: 'Products', href: `${baseUrl}/products`, rolePermessions: '104.0' },
    {
        title: 'Orders', modulePermessions: '106',
        children: [
            { title: 'Orders', href: `${baseUrl}/orders`, rolePermessions: '106.0' },
            // { title: 'Orders on Till', href: `${baseUrl}/orders-on-till` },
            { title: 'Orders on Till', href: `${baseUrl}/till-verification`, rolePermessions: '106.11' },
            { title: 'Ready to Dispatch', href: `${baseUrl}/ready-to-dispatch`, rolePermessions: '106.21' },
            { title: 'Dispatched', href: `${baseUrl}/dispatched`, rolePermessions: '106.31' },
        ]
    },
    { title: 'Carts', href: `${baseUrl}/cart`, rolePermessions: '1008.0' },
    
    { title: 'More', 
        children: [
            { title: 'Geo Zones', href: `${baseUrl}/zones`, rolePermessions: '105.0' },
            { title: 'Staff', href: `${baseUrl}/staff`, rolePermessions: '100.011' },
            { title: 'Driver Settlements', href: `${baseUrl}/drivers`, rolePermessions: '100.14' },
            { title: 'Vehicles', href: `${baseUrl}/vehicles`, rolePermessions: '1006.0' },
            { title: 'Delivery Slots', href: `${baseUrl}/delivery_slots`, rolePermessions: '107.0' },
            { title: 'Baskets', href: `${baseUrl}/baskets`, rolePermessions: '1005.0' },
            { title: 'Banners', href: `${baseUrl}/banners`, rolePermessions: '1007.0' },
            { title: 'Bags', href: `${baseUrl}/bags`, rolePermessions: '1009.0' },
        ]
    },
])


