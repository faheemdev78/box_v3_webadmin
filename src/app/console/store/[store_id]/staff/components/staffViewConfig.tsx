'use client'

import { ViewFilterConfig, ViewConfig, FilterField, ColumnConfig } from '@_/components/ViewFilter';

// Staff filter fields configuration
export const STAFF_FILTER_FIELDS: FilterField[] = [
    {
        key: 'name',
        label: 'Name',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'starts_with', label: 'Starts with' },
            { value: 'ends_with', label: 'Ends with' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'email',
        label: 'Email',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'phone',
        label: 'Phone',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' },
            { value: 'not_in', label: 'Is none of' }
        ],
        options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'On Leave', value: 'on_leave' },
            { label: 'Suspended', value: 'suspended' }
        ]
    },
    {
        key: 'department',
        label: 'Department',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' },
            { value: 'not_in', label: 'Is none of' }
        ],
        options: [
            { label: 'Operations', value: 'operations' },
            { label: 'Sales', value: 'sales' },
            { label: 'Customer Service', value: 'customer_service' },
            { label: 'Warehouse', value: 'warehouse' },
            { label: 'Delivery', value: 'delivery' },
            { label: 'Management', value: 'management' }
        ]
    },
    {
        key: 'position',
        label: 'Position',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' }
        ],
        options: [
            { label: 'Store Manager', value: 'store_manager' },
            { label: 'Assistant Manager', value: 'assistant_manager' },
            { label: 'Sales Associate', value: 'sales_associate' },
            { label: 'Cashier', value: 'cashier' },
            { label: 'Warehouse Staff', value: 'warehouse_staff' },
            { label: 'Delivery Driver', value: 'delivery_driver' }
        ]
    },
    {
        key: 'acc_type',
        label: 'Account Type',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' }
        ],
        options: [
            { label: 'Staff', value: 'staff' },
            { label: 'Admin', value: 'admin' },
            { label: 'Manager', value: 'manager' }
        ]
    },
    {
        key: 'acc_group',
        label: 'Account Group',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' }
        ],
        options: [
            { label: 'Manager', value: 'manager' },
            { label: 'Staff', value: 'staff' },
            { label: 'Part-time', value: 'part_time' }
        ]
    },
    {
        key: 'hourly_rate',
        label: 'Hourly Rate',
        type: 'number',
        operators: [
            { value: 'equals', label: 'Equals' },
            { value: 'not_equals', label: 'Not equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'join_date',
        label: 'Join Date',
        type: 'date',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
            { value: 'between', label: 'Between' },
            { value: 'last_7_days', label: 'Last 7 days' },
            { value: 'last_30_days', label: 'Last 30 days' },
            { value: 'this_month', label: 'This month' },
            { value: 'last_month', label: 'Last month' }
        ]
    },
    {
        key: 'performance_rating',
        label: 'Performance Rating',
        type: 'number',
        operators: [
            { value: 'equals', label: 'Equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' }
        ]
    },
    {
        key: 'attendance_rate',
        label: 'Attendance Rate (%)',
        type: 'number',
        operators: [
            { value: 'equals', label: 'Equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' }
        ]
    }
];

// Available columns for staff table
export const STAFF_AVAILABLE_COLUMNS: ColumnConfig[] = [
    { key: 'name', label: 'Name', visible: true, sortable: true },
    { key: 'email', label: 'Email', visible: true, sortable: true },
    { key: 'phone', label: 'Phone', visible: true, sortable: false },
    { key: 'status', label: 'Status', visible: true, sortable: true },
    { key: 'position', label: 'Position', visible: true, sortable: true },
    { key: 'department', label: 'Department', visible: true, sortable: true },
    { key: 'hourly_rate', label: 'Hourly Rate', visible: false, sortable: true },
    { key: 'performance_rating', label: 'Performance', visible: false, sortable: true },
    { key: 'attendance_rate', label: 'Attendance', visible: false, sortable: true },
    { key: 'join_date', label: 'Join Date', visible: false, sortable: true },
    { key: 'actions', label: 'Actions', visible: true, sortable: false }
];

// Default columns to display
export const STAFF_DEFAULT_COLUMNS = ['name', 'email', 'phone', 'status', 'position', 'department', 'actions'];

// Initial demo views
export const INITIAL_STAFF_VIEWS: ViewConfig[] = [
    {
        id: 'view_1',
        name: 'Active Store Managers',
        description: 'All active staff with store manager position',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'status', operator: 'equals', value: 'active' },
                    { field: 'position', operator: 'equals', value: 'store_manager' }
                ]
            }
        ],
        columns: STAFF_AVAILABLE_COLUMNS.filter(c => STAFF_DEFAULT_COLUMNS.includes(c.key)),
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
        name: 'High Performers',
        description: 'Staff with rating > 4.0 and attendance > 90%. You can adjust the rating and attendance thresholds.',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'performance_rating', operator: 'greater_than', value: 4.0, isChangeable: true },
                    { field: 'attendance_rate', operator: 'greater_than', value: 90, isChangeable: true }
                ]
            }
        ],
        columns: [
            ...STAFF_AVAILABLE_COLUMNS.filter(c => STAFF_DEFAULT_COLUMNS.includes(c.key)),
            STAFF_AVAILABLE_COLUMNS.find(c => c.key === 'performance_rating')!,
            STAFF_AVAILABLE_COLUMNS.find(c => c.key === 'attendance_rate')!
        ],
        visibility: 'team',
        createdBy: 'admin_user',
        createdAt: '2024-01-10T14:30:00Z',
        isFavorite: true,
        isPinned: true,
        isDefault: false,
        isHidden: false,
        order: 1
    },
    {
        id: 'view_3',
        name: 'Recent Hires',
        description: 'Staff who joined in the last 30 days',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'join_date', operator: 'last_30_days', value: null }
                ]
            }
        ],
        columns: [
            ...STAFF_AVAILABLE_COLUMNS.filter(c => STAFF_DEFAULT_COLUMNS.includes(c.key)),
            STAFF_AVAILABLE_COLUMNS.find(c => c.key === 'join_date')!
        ],
        visibility: 'private',
        createdBy: 'admin_user',
        createdAt: '2024-01-05T09:00:00Z',
        isFavorite: false,
        isPinned: false,
        isDefault: false,
        isHidden: false,
        order: 2
    },
    {
        id: 'view_4',
        name: 'Inactive Staff',
        description: 'All inactive or suspended staff members',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'status', operator: 'in', value: ['inactive', 'suspended'] }
                ]
            }
        ],
        columns: STAFF_AVAILABLE_COLUMNS.filter(c => STAFF_DEFAULT_COLUMNS.includes(c.key)),
        visibility: 'team',
        createdBy: 'admin_user',
        createdAt: '2024-01-03T11:00:00Z',
        isFavorite: false,
        isPinned: false,
        isDefault: false,
        isHidden: false,
        order: 3
    }
];

// Create staff view configuration
export function createStaffViewConfig(currentUser: { id: string; role: string; teamId?: string }): ViewFilterConfig {
    return {
        resourceType: 'Staff',
        filterFields: STAFF_FILTER_FIELDS,
        availableColumns: STAFF_AVAILABLE_COLUMNS,
        defaultColumns: STAFF_DEFAULT_COLUMNS,
        currentUser
    };
}