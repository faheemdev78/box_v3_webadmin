export const UserRightsArray = [
    { _id: 100, title: 'Accounts Management',
        rules: [
            { title: 'User Management', key: '100.0' },
            { title: 'Account type management', key: '100.1' },
            { title: 'User permissions manager', key: '100.2' },

            { heading: 'Staff Management', key: '0.00' },
            { title: 'Add Staff', key: '100.10' },
            { title: 'Update Staff', key: '100.11' },
            { title: 'Delete Staff', key: '100.12' },

            { heading: 'Manager Account Management', key: '0.01' },
            { title: 'Add Managers', key: '100.20' },
            { title: 'Update Managers', key: '100.21' },
            { title: 'Delete Managers', key: '100.22' },
        ]
    },

    { _id: 103, title: 'Stores',
        rules: [
            { title: 'Manager Other Stores', key: '103.0' },
            { title: 'Create Store', key: '103.1' },
            { title: 'Edit Store', key: '103.2' },
            { title: 'Delete Store', key: '103.3' },
        ]
    },

    { _id: 104, title: 'Product Manager',
        rules: [
            { title: 'Manage Attributes', key: '104.1' },
            { title: 'Manage Product Types', key: '104.2' },
            { title: 'Create Products', key: '104.3' },
            { title: 'Edit Products', key: '104.4' },
            { title: 'Delete Products', key: '104.5' },
            { title: 'Manage Categories', key: '104.6' },
            { title: 'Re-Init product for store', key: '104.7' },
            { title: 'Manage Product Fields', key: '104.8' },
            { title: 'Manage Brands', key: '104.9' },
            { title: 'Manage Manufacturers', key: '104.10' },
        ]
    },

    { _id: 105, title: 'Zone Manager',
        rules: [
            { title: 'Add Zone', key: '105.1' },
            { title: 'Delete Zone', key: '105.2' },
            { title: 'Edit Zone', key: '105.3' },
        ]
    },
    { _id: 106, title: 'Orders Management',
        rules: [
            { title: 'Cancel Order', key: '106.1' },
            { title: 'Delete Order', key: '106.2' },
            { title: 'Manage Till', key: '106.3' },
        ]
    },
    { _id: 107, title: 'Slot Management',
        rules: [
            { title: 'Add Slot', key: '107.1' },
            { title: 'Delete Slot', key: '107.2' },
            { title: 'Edit Slot', key: '107.3' },
        ]
    },
    { _id: 108, title: 'Box Management',
        rules: [
            { title: 'Add Box', key: '108.1' },
            { title: 'Delete Box', key: '108.2' },
            { title: 'Edit Box', key: '108.3' },
        ]
    },

    { _id: 900, title: 'System Configurations',
        rules: [
            { title: 'Manage Locations', key: '900.1' },
            { title: 'Manage Tags', key: '900.4' },
            { title: 'Access System Settings', key: '900.6' },
        ]
    },

    { _id: 1000, title: 'Composer',
        rules: [
            { title: 'Create pages', key: '1000.0' },
            { title: 'Update pages', key: '1000.1' },
            { title: 'Delete pages', key: '1000.2' },
            
            { title: 'Manage Modules', key: '1000.3' },
        ]
    },

    { _id: 1001, title: 'Dashboard',
        rules: [
            { title: 'Show Sales Chart', key: '1001.1' },
        ]
    },

    { _id: 1002, title: 'Customer',
        rules: [
            { title: 'Show Customer list', key: '1002.1' },
        ]
    },

];
