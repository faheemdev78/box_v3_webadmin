# Dynamic Filter/View Component System

This is a fully dynamic, reusable HubSpot-style filter and view management system that can be used across different entity types (products, customers, orders, staff, etc.).

## 📁 File Structure

```
view_filter/
├── types.ts                           # TypeScript type definitions
├── utils.ts                           # Utility functions for data manipulation
├── products.js                        # Sample products data
├── README.md                          # This file
├── page.tsx                           # Original demo page (contacts)
├── products_page.tsx                  # Products implementation (using dynamic system)
├── components/
│   ├── EditColumnsModal.tsx          # Edit columns with drag-and-drop
│   └── QuickFiltersBar.tsx           # Quick filters bar (changeable + static)
└── configs/
    └── productsConfig.tsx            # Product-specific configuration
```

## 🎯 Key Features

### 1. **Dynamic Configuration System**
- Define entity-specific fields, columns, and filter options via configuration
- Support for nested data paths (e.g., `brand.title`)
- Custom renderers for table cells
- Field grouping for better organization

### 2. **Edit Columns Modal**
- Searchable list of all available columns
- Drag-and-drop column reordering
- Column grouping (Product Information, Stock, Dates, etc.)
- Frozen columns support
- Matches HubSpot's design exactly

### 3. **Quick Filters Bar**
- **Changeable Filters**: Interactive dropdowns that users can modify without editing the view
- **Static Filters**: Read-only tags showing fixed filter values
- "Clear all" functionality
- "Advanced filters" button to open full filter editor

### 4. **View Management**
- Create, edit, delete saved views
- Pin/unpin views as tabs
- Default view support
- View visibility (Private, Team, Everyone)
- View descriptions

### 5. **Client-Side Filtering & Sorting**
- Filter data based on various operators (equals, contains, greater_than, etc.)
- Sort by any sortable column
- Support for complex filter conditions

## 🚀 Usage Example

### Creating a Configuration for a New Entity Type

```typescript
// configs/customersConfig.tsx
import { FilterComponentConfig } from '../types';

export const customersConfig: FilterComponentConfig = {
  entityType: 'customers',
  entityLabel: 'Customers',
  entityLabelSingular: 'Customer',

  fields: [
    {
      key: 'name',
      label: 'Customer Name',
      type: 'text',
      group: 'Customer Information',
      operators: ['equals', 'contains', 'starts_with'],
      isFilterable: true,
      isSortable: true,
      isSearchable: true
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      group: 'Contact Information',
      operators: ['equals', 'contains'],
      isFilterable: true,
      isSortable: true
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      group: 'Customer Information',
      operators: ['equals', 'in'],
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ],
      isFilterable: true,
      isSortable: true,
      render: (value) => <Tag color={value === 'active' ? 'green' : 'red'}>{value}</Tag>
    }
    // ... more fields
  ],

  availableColumns: [
    {
      key: 'name',
      label: 'Customer Name',
      visible: true,
      sortable: true,
      group: 'Customer Information'
    },
    // ... more columns
  ],

  defaultColumns: ['name', 'email', 'status'],
  defaultSort: { field: 'name', direction: 'asc' },
  rowKey: 'id'
};
```

### Using the Configuration

```typescript
// customers_page.tsx
import { customersConfig } from './configs/customersConfig';
import { generateTableColumns, applyFilters, applySort } from './utils';
import { EditColumnsModal } from './components/EditColumnsModal';
import { QuickFiltersBar } from './components/QuickFiltersBar';

// In your component:
const tableColumns = generateTableColumns(customersConfig, activeView.columns);
const filteredData = applyFilters(customersData, activeView.filters);

// Render quick filters
<QuickFiltersBar
  filters={activeView.filters}
  fields={customersConfig.fields}
  onFilterChange={handleFilterChange}
/>

// Render edit columns modal
<EditColumnsModal
  availableColumns={customersConfig.availableColumns}
  selectedColumns={activeView.columns}
  onApply={handleApplyColumns}
/>
```

## 📋 Type Definitions

### FilterComponentConfig
Main configuration object for an entity type.

```typescript
interface FilterComponentConfig {
  entityType: string;           // 'products', 'customers', etc.
  entityLabel: string;           // 'Products', 'Customers'
  entityLabelSingular: string;   // 'Product', 'Customer'
  fields: FieldDefinition[];
  availableColumns: ColumnDefinition[];
  defaultColumns: string[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  rowKey: string;
}
```

### FieldDefinition
Defines a field that can be filtered, sorted, or displayed.

```typescript
interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;              // 'text', 'number', 'date', 'select', etc.
  group?: string;               // For grouping in UI
  operators: FilterOperator[];   // Available filter operators
  options?: { label: string; value: any }[];  // For select fields
  isFilterable?: boolean;
  isSortable?: boolean;
  isSearchable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
  dataPath?: string;            // For nested data access
}
```

### SavedView
Represents a saved view/filter.

```typescript
interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: FilterCondition[];
  quickFilters?: QuickFilter[];
  columns: string[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  visibility: 'private' | 'team' | 'everyone';
  owner: string;
  isPinned: boolean;
  isDefault?: boolean;
}
```

## 🎨 HubSpot Design Patterns Implemented

1. **Tabs for Pinned Views**: Starred/pinned views appear as tabs
2. **Add View & All Views**: Dropdown button with view management options
3. **Quick Filters Bar**: Shows active filters with:
   - Changeable filters as interactive dropdowns
   - Static filters as read-only tags
   - Clear all button
4. **Edit Columns**: Two-column modal with:
   - Left: Searchable, grouped list of all available columns
   - Right: Selected columns with drag-and-drop reordering
5. **Advanced Filters Drawer**: Split-screen with current filters and available filters
6. **Create View Modal**: Simple form with name, description, and visibility options

## 🔧 Utility Functions

### `getNestedValue(obj, path)`
Access nested object properties using dot notation.

```typescript
getNestedValue({ brand: { title: 'Adams' } }, 'brand.title')  // => 'Adams'
```

### `generateTableColumns(config, visibleColumnKeys)`
Generate Ant Design table columns from configuration.

### `applyFilters(data, filters)`
Client-side filtering based on filter conditions.

### `applySort(data, field, direction)`
Client-side sorting.

## 🔄 Integration with Backend

For production use, you'll want to:

1. **Replace client-side filtering with server-side filtering**:
   ```typescript
   const fetchData = async (filters) => {
     const response = await fetch('/api/products', {
       method: 'POST',
       body: JSON.stringify({ filters })
     });
     return response.json();
   };
   ```

2. **Save views to database**:
   ```typescript
   const handleSaveView = async (view) => {
     await fetch('/api/views', {
       method: 'POST',
       body: JSON.stringify(view)
     });
   };
   ```

3. **Load views from database**:
   ```typescript
   const { data: savedViews } = useSWR('/api/views');
   ```

## 📝 Example: Products Implementation

Check [products_page.tsx](./products_page.tsx) for a complete working example with:
- 4 predefined views
- Changeable status filter in "Adams Brand Products" view
- Dynamic table columns
- Edit columns functionality
- Quick filters bar

## 🎯 Next Steps

1. **Filter Builder**: Add a visual filter builder for creating/editing filters
2. **Server Integration**: Connect to GraphQL/REST API for data fetching
3. **Real-time Updates**: Add WebSocket support for live data updates
4. **Export Functionality**: Implement CSV/Excel export
5. **Column Resizing**: Add resizable columns
6. **Saved Searches**: Allow saving search queries
7. **Filter Templates**: Create reusable filter templates

## 💡 Tips

- Keep configurations in separate files per entity type
- Use TypeScript for type safety
- Leverage the grouping feature for better UX
- Use custom renderers for complex cell displays
- Consider performance for large datasets (use server-side filtering)

## 🐛 Troubleshooting

**Issue**: Nested data not displaying
**Solution**: Make sure to use `dataPath` property in FieldDefinition

**Issue**: Table not updating after filter changes
**Solution**: Ensure you're using React.useMemo for processedData

**Issue**: Drag-and-drop not working in Edit Columns
**Solution**: Make sure @dnd-kit packages are installed

## 📚 Dependencies

- React 18+
- Ant Design 5+
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- TypeScript 4+