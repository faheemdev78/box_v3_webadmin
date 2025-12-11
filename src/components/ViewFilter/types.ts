// Core types for the reusable View/Filter system

export interface FilterField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'daterange' | 'boolean';
    operators: FilterOperator[];
    options?: { label: string; value: string }[];
}

export interface FilterOperator {
    value: string;
    label: string;
}

export interface FilterCondition {
    field: string;
    operator: string;
    value: any;
    isChangeable?: boolean; // If true, users can modify this value at runtime without changing the saved view
}

export interface FilterGroup {
    logic: 'AND' | 'OR';
    conditions: FilterCondition[];
}

export interface ColumnConfig {
    key: string;
    label: string;
    visible: boolean;
    width?: number;
    fixed?: 'left' | 'right';
    sortable?: boolean;
}

export interface SortConfig {
    field: string;
    order: 'asc' | 'desc';
}

export type ViewVisibility = 'private' | 'team' | 'everyone';

export interface ViewConfig {
    id: string;
    name: string;
    description?: string;

    // Filter configuration
    filterGroups: FilterGroup[];

    // Display configuration
    columns: ColumnConfig[];
    sort?: SortConfig;

    // View metadata
    visibility: ViewVisibility;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;

    // View behavior
    isFavorite: boolean;
    isPinned: boolean;
    isDefault: boolean;
    isHidden: boolean;
    order: number; // For tab ordering
}

export interface ViewFilterConfig {
    // Resource type (staff, customer, product, order, etc.)
    resourceType: string;

    // Available fields for filtering
    filterFields: FilterField[];

    // Available columns for display
    availableColumns: ColumnConfig[];

    // Default columns to show
    defaultColumns: string[];

    // Current user info for permissions
    currentUser: {
        id: string;
        role: 'user' | 'admin' | 'super_admin';
        teamId?: string;
    };
}

export interface ViewFilterCallbacks {
    onApplyView?: (view: ViewConfig) => void;
    onSaveView?: (view: ViewConfig) => Promise<void>;
    onUpdateView?: (view: ViewConfig) => Promise<void>;
    onDeleteView?: (viewId: string) => Promise<void>;
    onLoadViews?: () => Promise<ViewConfig[]>;
}