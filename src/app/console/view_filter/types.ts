// Dynamic Filter/View Configuration Types

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'object' | 'array';

export type FilterOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal'
  | 'in' | 'not_in'
  | 'is_empty' | 'is_not_empty'
  | 'is_true' | 'is_false';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  group?: string; // For grouping fields in UI (e.g., "Contact activity", "Contact information")
  operators: FilterOperator[]; // Available operators for this field
  options?: { label: string; value: any }[]; // For select/multiselect fields
  isFilterable?: boolean; // Can this field be used in filters?
  isSortable?: boolean; // Can this field be sorted?
  isSearchable?: boolean; // Can this field be searched?
  render?: (value: any, record: any) => React.ReactNode; // Custom renderer for table column
  dataPath?: string; // Nested path for accessing data (e.g., "brand.title")
}

export interface ColumnDefinition {
  key: string;
  label: string;
  visible: boolean; // Is this column visible by default?
  sortable: boolean;
  width?: number;
  frozen?: boolean; // Is this column frozen (always visible)?
  group?: string; // For grouping columns in Edit Columns modal
}

export interface FilterCondition {
  id: string;
  field: string; // Field key from FieldDefinition
  operator: FilterOperator;
  value: any;
  isChangeable?: boolean; // For filters that users can modify via quick filters
}

export interface QuickFilter {
  field: string;
  label: string;
  options: { label: string; value: any }[];
  currentValue?: any;
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: FilterCondition[]; // Advanced filters (flat list for backward compatibility)
  filterGroups?: FilterGroup[]; // New grouped filters structure
  quickFilters?: QuickFilter[]; // Quick filters (for changeable fields)
  columns: string[]; // Array of column keys to display
  sort?: { field: string; direction: 'asc' | 'desc' };
  visibility: 'private' | 'team' | 'everyone';
  owner: string;
  isPinned: boolean;
  isDefault?: boolean;
}

// Main configuration for the filter component
export interface FilterComponentConfig {
  entityType: string; // 'products', 'customers', 'orders', etc.
  entityLabel: string; // Display name (e.g., "Products", "Customers")
  entityLabelSingular: string; // Singular form (e.g., "Product", "Customer")

  // Field definitions - all available fields for filtering/display
  fields: FieldDefinition[];

  // Column definitions - controls which fields appear as columns and their order
  availableColumns: ColumnDefinition[];
  defaultColumns: string[]; // Default columns to display

  // Default sort
  defaultSort?: { field: string; direction: 'asc' | 'desc' };

  // Row key for table
  rowKey: string; // Field to use as unique row key (e.g., "_id", "id")

  // Custom renderers
  renderCell?: (field: string, value: any, record: any) => React.ReactNode;
}