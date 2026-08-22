export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'id' | 'array';

export type FilterOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'between'
  | 'in' | 'not_in'
  | 'exists' | 'not_exists'
  | 'is_true' | 'is_false';

export type FilterLogic = 'AND' | 'OR';

export type FilterFieldOption = {
  label: string;
  value: string | number | boolean;
};

export type FilterField = {
  key: string;
  label: string;
  type: FilterFieldType;
  group?: string;
  operators: FilterOperator[];
  options?: FilterFieldOption[];
  dataPath?: string;
  isFilterable?: boolean;
  isSearchable?: boolean;
  isSortable?: boolean;
};

export type FilterCondition = {
  id: string;
  field: string;
  operator: FilterOperator | '';
  value?: any;
};

export type FilterGroup = {
  id: string;
  logic: FilterLogic;
  joinLogic?: FilterLogic;
  conditions: FilterCondition[];
};

export type SavedDynamicFilter = {
  _id: string;
  entityType: string;
  name: string;
  description?: string;
  filterGroups: FilterGroup[];
  columns?: string[];
  sort?: { field?: string; direction?: string };
  isPinned?: boolean;
  isDefault?: boolean;
  visibility?: string;
  owner?: string;
  storeId?: string;
};

export const ALL_ORDERS_TAB_ID = '__all_orders__';

export const VALUE_OPTIONAL_OPERATORS: FilterOperator[] = ['exists', 'not_exists', 'is_true', 'is_false'];

export const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This week', value: 'this_week' },
  { label: 'Last 7 days', value: 'last_7_days' },
  { label: 'Last 30 days', value: 'last_30_days' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
];
