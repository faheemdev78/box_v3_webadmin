'use client'

import { ViewFilterConfig, ViewConfig, FilterField, ColumnConfig } from '@_/components/ViewFilter';

// Order filter fields configuration
export const ORDER_FILTER_FIELDS: FilterField[] = [
    {
        key: 'serial',
        label: 'Order Number',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'starts_with', label: 'Starts with' },
        ]
    },
    {
        key: 'customer.name',
        label: 'Customer Name',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'status.order',
        label: 'Order Status',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' },
            { value: 'not_in', label: 'Is none of' }
        ],
        options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Picked', value: 'picked' },
            { label: 'Verified', value: 'verified' },
            { label: 'Out for Delivery', value: 'out_for_delivery' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Failed', value: 'failed' }
        ]
    },
    {
        key: 'status.payment',
        label: 'Payment Status',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' }
        ],
        options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Authorized', value: 'authorized' },
            { label: 'Paid', value: 'paid' },
            { label: 'Failed', value: 'failed' },
            { label: 'Refunded', value: 'refunded' },
            { label: 'Partially Refunded', value: 'partially_refunded' }
        ]
    },
    {
        key: 'status.fulfillment',
        label: 'Fulfillment Status',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' }
        ],
        options: [
            { label: 'Unfulfilled', value: 'unfulfilled' },
            { label: 'Partially Fulfilled', value: 'partially_fulfilled' },
            { label: 'Fulfilled', value: 'fulfilled' },
            { label: 'Returned', value: 'returned' }
        ]
    },
    {
        key: 'current_stage',
        label: 'Current Stage',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' }
        ],
        options: [
            { label: 'Picking', value: 'picking' },
            { label: 'Till Verification', value: 'till_verification' },
            { label: 'Delivery', value: 'delivery' }
        ]
    },
    {
        key: 'lock_type',
        label: 'Lock Type',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'is_empty', label: 'Not locked' },
            { value: 'is_not_empty', label: 'Is locked' }
        ],
        options: [
            { label: 'Picking', value: 'picking' },
            { label: 'Till Verification', value: 'till_verification' },
            { label: 'Delivery', value: 'delivery' }
        ]
    },
    {
        key: 'viewed',
        label: 'Viewed Status',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' }
        ],
        options: [
            { label: 'Viewed', value: true },
            { label: 'Not Viewed', value: false }
        ]
    },
    {
        key: 'pickup_allow',
        label: 'Pickup Allowed',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' }
        ],
        options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
        ]
    },
    {
        key: 'delivery_slot.date',
        label: 'Delivery Date',
        type: 'date',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
            { value: 'between', label: 'Between' },
            { value: 'today', label: 'Today' },
            { value: 'tomorrow', label: 'Tomorrow' },
            { value: 'next_7_days', label: 'Next 7 days' },
            { value: 'this_week', label: 'This week' },
            { value: 'next_week', label: 'Next week' }
        ]
    },
    {
        key: 'delivery_slot.slot',
        label: 'Delivery Slot',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' }
        ]
    },
    {
        key: 'zone.title',
        label: 'Zone',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' }
        ]
    },
    {
        key: 'original_order.totals.grand_total',
        label: 'Order Total',
        type: 'number',
        operators: [
            { value: 'equals', label: 'Equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' }
        ]
    },
    {
        key: 'createdAt',
        label: 'Order Date',
        type: 'date',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
            { value: 'between', label: 'Between' },
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'last_7_days', label: 'Last 7 days' },
            { value: 'last_30_days', label: 'Last 30 days' },
            { value: 'this_month', label: 'This month' },
            { value: 'last_month', label: 'Last month' }
        ]
    },
    {
        key: 'updatedAt',
        label: 'Last Updated',
        type: 'date',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
            { value: 'between', label: 'Between' },
            { value: 'last_hour', label: 'Last hour' },
            { value: 'today', label: 'Today' },
            { value: 'last_7_days', label: 'Last 7 days' }
        ]
    }
];

// Available columns for orders table
export const ORDER_AVAILABLE_COLUMNS: ColumnConfig[] = [
    { key: 'serial', label: 'Order #', visible: true, sortable: true },
    { key: 'customer', label: 'Customer', visible: true, sortable: true },
    { key: 'picker', label: 'Picker', visible: false, sortable: false },
    { key: 'order', label: 'Order Total', visible: true, sortable: true },
    { key: 'delivery_slot', label: 'Delivery Slot', visible: true, sortable: true },
    { key: 'status', label: 'Status', visible: true, sortable: true },
    { key: 'current_stage', label: 'Stage', visible: false, sortable: true },
    { key: 'zone', label: 'Zone', visible: false, sortable: false },
    { key: 'viewed', label: 'Viewed', visible: false, sortable: true },
    { key: 'lock_type', label: 'Lock Status', visible: false, sortable: false },
    { key: 'createdAt', label: 'Created', visible: true, sortable: true },
    { key: 'updatedAt', label: 'Updated', visible: false, sortable: true },
    { key: 'actions', label: 'Actions', visible: true, sortable: false }
];

// Default columns to display
export const ORDER_DEFAULT_COLUMNS = ['serial', 'customer', 'order', 'delivery_slot', 'status', 'createdAt', 'actions'];

// Initial demo views for orders
export const INITIAL_ORDER_VIEWS: ViewConfig[] = [
    // {
    //     id: 'view_0',
    //     name: 'All Orders',
    //     description: 'All orders',
    //     filterGroups: [
    //         // {
    //         //     logic: 'AND',
    //         //     conditions: [
    //         //         { field: 'status.order', operator: 'equals', value: 'pending' }
    //         //     ]
    //         // }
    //     ],
    //     columns: ORDER_AVAILABLE_COLUMNS.filter(c => ORDER_DEFAULT_COLUMNS.includes(c.key)),
    //     visibility: 'everyone',
    //     createdBy: 'admin_user',
    //     createdAt: '2024-01-15T10:00:00Z',
    //     isFavorite: true,
    //     isPinned: true,
    //     isDefault: true,
    //     isHidden: false,
    //     order: 0
    // },
    {
        id: 'view_1',
        name: 'Pending Orders',
        description: 'All pending orders waiting for processing',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'status.order', operator: 'equals', value: 'pending' }
                ]
            }
        ],
        columns: ORDER_AVAILABLE_COLUMNS.filter(c => ORDER_DEFAULT_COLUMNS.includes(c.key)),
        visibility: 'everyone',
        createdBy: 'admin_user',
        createdAt: '2024-01-15T10:00:00Z',
        isFavorite: true,
        isPinned: true,
        isDefault: true,
        isHidden: false,
        order: 0
    },
    {
        id: 'view_2',
        name: 'Today\'s Deliveries',
        description: 'Orders scheduled for delivery today',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'delivery_slot.date', operator: 'today', value: null },
                    { field: 'status.order', operator: 'not_in', value: ['cancelled', 'completed'] }
                ]
            }
        ],
        columns: [
            ...ORDER_AVAILABLE_COLUMNS.filter(c => ORDER_DEFAULT_COLUMNS.includes(c.key)),
            ORDER_AVAILABLE_COLUMNS.find(c => c.key === 'zone')!
        ],
        visibility: 'everyone',
        createdBy: 'admin_user',
        createdAt: '2024-01-14T09:00:00Z',
        isFavorite: true,
        isPinned: true,
        isDefault: false,
        isHidden: false,
        order: 1
    },
    {
        id: 'view_3',
        name: 'In Picking',
        description: 'Orders currently being picked',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'current_stage', operator: 'equals', value: 'picking' },
                    { field: 'lock_type', operator: 'is_not_empty', value: null }
                ]
            }
        ],
        columns: [
            ...ORDER_AVAILABLE_COLUMNS.filter(c => ORDER_DEFAULT_COLUMNS.includes(c.key)),
            ORDER_AVAILABLE_COLUMNS.find(c => c.key === 'picker')!,
            ORDER_AVAILABLE_COLUMNS.find(c => c.key === 'lock_type')!
        ],
        visibility: 'team',
        createdBy: 'admin_user',
        createdAt: '2024-01-12T11:00:00Z',
        isFavorite: true,
        isPinned: true,
        isDefault: false,
        isHidden: false,
        order: 2
    },
    {
        id: 'view_4',
        name: 'Payment Failed',
        description: 'Orders with failed payment',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'status.payment', operator: 'equals', value: 'failed' }
                ]
            }
        ],
        columns: ORDER_AVAILABLE_COLUMNS.filter(c => ORDER_DEFAULT_COLUMNS.includes(c.key)),
        visibility: 'team',
        createdBy: 'admin_user',
        createdAt: '2024-01-10T15:00:00Z',
        isFavorite: false,
        isPinned: false,
        isDefault: false,
        isHidden: false,
        order: 3
    },
    {
        id: 'view_5',
        name: 'High Value Orders',
        description: 'Orders with total amount greater than $100',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'original_order.totals.grand_total', operator: 'greater_than', value: 100, isChangeable: true }
                ]
            }
        ],
        columns: ORDER_AVAILABLE_COLUMNS.filter(c => ORDER_DEFAULT_COLUMNS.includes(c.key)),
        visibility: 'private',
        createdBy: 'admin_user',
        createdAt: '2024-01-08T13:00:00Z',
        isFavorite: false,
        isPinned: false,
        isDefault: false,
        isHidden: false,
        order: 4
    },
    {
        id: 'view_6',
        name: 'Unviewed Orders',
        description: 'New orders that haven\'t been viewed yet',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'viewed', operator: 'equals', value: false },
                    { field: 'status.order', operator: 'not_equals', value: 'cancelled' }
                ]
            }
        ],
        columns: ORDER_AVAILABLE_COLUMNS.filter(c => ORDER_DEFAULT_COLUMNS.includes(c.key)),
        visibility: 'everyone',
        createdBy: 'admin_user',
        createdAt: '2024-01-05T08:00:00Z',
        isFavorite: false,
        isPinned: false,
        isDefault: false,
        isHidden: false,
        order: 5
    }
];

// Create order view configuration
export function createOrderViewConfig(currentUser: { id: string; role: string; teamId?: string }): ViewFilterConfig {
    return {
        resourceType: 'Order',
        filterFields: ORDER_FILTER_FIELDS,
        availableColumns: ORDER_AVAILABLE_COLUMNS,
        defaultColumns: ORDER_DEFAULT_COLUMNS,
        currentUser
    };
}
