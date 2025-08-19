import { adminRoot } from "@_/configs"


export const topMenuArray = [
    { title: 'Dashboard', href: `${adminRoot}/dashboard` },
    { title: 'Products', href: `${adminRoot}/products`, modulePermessions: '104',
        children: [
            { title: 'Catelogue', href: `${adminRoot}/products/list` },
            { title: 'Attributes', href: `${adminRoot}/product_props/attributes`, rolePermessions: "104.1" },
            { title: 'Product Types', href: `${adminRoot}/product_props/types`, rolePermessions: '104.2' },
            { title: 'Categories', href: `${adminRoot}/product_props/categories`, rolePermessions: '104.6' },
            { title: 'Manufacturer', href: `${adminRoot}/product_props/manufacturers`, rolePermessions: '104.10' },
            { title: 'Brands', href: `${adminRoot}/product_props/brands`, rolePermessions: '104.9' },
            { title: 'Product Fields', href: `${adminRoot}/product_props/fields`, rolePermessions: '104.8' },
        ]
    },
    { title: 'Orders', href: `${adminRoot}/orders`, modulePermessions: '106',
        children: [
            { title: 'Orders List', href: `${adminRoot}/orders`, modulePermessions: '106' },
            { title: 'Orders on Till', href: `${adminRoot}/orders-on-till`, rolePermessions: '104.1' },
            { title: 'Ready to Dispatch', href: `${adminRoot}/ready-to-dispatch`, rolePermessions: '104.1' },
            { title: 'Dispatched', href: `${adminRoot}/dispatched`, rolePermessions: '104.1' },
            { title: 'Cart', href: `${adminRoot}/cart`, rolePermessions: '104.1' },
        ]
    },
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
    { title: 'Composer', href: `${adminRoot}/composer`, modulePermessions: '1000',
        children: [
            { title: 'Components', href: `${adminRoot}/composer/components`, rolePermessions: '1000.3' },
            { title: 'Pages', href: `${adminRoot}/composer/pages` },
        ]
    },

    {
        title: 'More', //href: "#",
        children: [
            { title: 'Settings', href: `${adminRoot}/settings`, rolePermessions: '900.6' },
            { title: 'Users', href: `${adminRoot}/users`, rolePermessions: '100.0' }, // modulePermessions
            { title: 'Locations', href: `${adminRoot}/locations`, rolePermessions: '900.1' },
            { title: 'Tags', href: `${adminRoot}/tags`, rolePermessions: '900.4' },
            { title: 'Customers', href: `${adminRoot}/customers`, rolePermessions: '1002.1' },
        ]
    },
]


