# Dynamic View Filter - Complete Guide

This guide explains how to deploy the DynamicViewFilter component on any page and customize column rendering.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Entity Configuration](#entity-configuration)
3. [Custom Column Renderers](#custom-column-renderers)
4. [Deploying on a Page](#deploying-on-a-page)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Configure Your Entity

First, configure your entity type in the **View Manager** (`/console/view_manager`):

1. Click "Create Entity Config"
2. Fill in basic info:
   - **Entity Type**: `orders` (lowercase, matches your MongoDB collection)
   - **Entity Label**: `Orders` (plural)
   - **Entity Label Singular**: `Order`
   - **Row Key**: `_id` (unique identifier field)
3. Add **Field Definitions** (what can be filtered/sorted)
4. Add **Column Definitions** (what appears in the table)
5. Set **Default Columns** and **Sort**

### 2. Deploy on Your Page

```tsx
import { DynamicViewFilter } from '@/app/console/view_filter/components/DynamicViewFilter';

export default function OrdersPage() {
  return (
    <Page>
      <DynamicViewFilter entityType="orders" />
    </Page>
  );
}
```

That's it! The component will:
- ✅ Load the entity configuration from the database
- ✅ Load saved views
- ✅ Display filters and table
- ✅ Handle pagination, sorting, and filtering

---

## Entity Configuration

### Field Definitions

Fields control what can be filtered, sorted, and searched:

| Field | Description | Example |
|-------|-------------|---------|
| **Field Key** | Database field name (use dots for nested) | `status.order`, `customer.name` |
| **Label** | Display name | `Order Status`, `Customer Name` |
| **Type** | Data type | `text`, `number`, `date`, `select`, `boolean` |
| **Group** | Category for organization | `Order Info`, `Customer Info` |
| **Data Path** | Override path for nested data | `customer.profile.email` |
| **Operators** | Available filter operators | `equals`, `contains`, `greater_than` |
| **Options** | For select/multiselect fields | `[{label: "Pending", value: "pending"}]` |
| **Is Filterable** | Can be filtered | ✓ |
| **Is Sortable** | Can be sorted | ✓ |
| **Is Searchable** | Included in search | ✓ |

### Column Definitions

Columns control what appears in the table:

| Field | Description | Example |
|-------|-------------|---------|
| **Column Key** | Must match a field key | `status.order` |
| **Label** | Column header | `Status` |
| **Group** | For Edit Columns modal | `Order Details` |
| **Width** | Fixed width in pixels | `150` |
| **Visible** | Show by default | ✓ |
| **Sortable** | Enable sorting | ✓ |
| **Frozen** | Pin to left | ✗ |

---

## Custom Column Renderers

Custom renderers allow you to format data in the table (dates, status tags, images, etc.).

### Option 1: Full Column Configuration Objects (Recommended)

Pass complete Ant Design column configuration objects (including width, align, render, fixed, ellipsis, etc.):

```tsx
import { DynamicViewFilter } from '@/app/console/view_filter/components/DynamicViewFilter';
import { orderColumnConfigs } from '@/app/console/view_filter/columnRenderers';

export default function OrdersPage() {
  return (
    <DynamicViewFilter
      entityType="orders"
      customColumns={orderColumnConfigs}  // ← Pass full column configs
    />
  );
}
```

Or define your own custom column configurations:

```tsx
import { DynamicViewFilter } from '@/app/console/view_filter/components/DynamicViewFilter';
import { Tag } from 'antd';
import dayjs from 'dayjs';

const customColumns = {
  'title': {
    width: 200,
    ellipsis: true,  // Truncate with ellipsis
    render: (value: any) => <strong>{value}</strong>,
  },
  'status': {
    width: 120,
    align: 'center',
    fixed: 'left',  // Pin column to left
    render: (value: any) => <Tag color="green">{value}</Tag>,
  },
  'price': {
    width: 100,
    align: 'right',
    render: (value: any) => `$${Number(value).toFixed(2)}`,
  },
  'created_at': {
    width: 180,
    render: (value: any) => dayjs(value).format('MMM D, YYYY h:mm A'),
  },
};

export default function OrdersPage() {
  return (
    <DynamicViewFilter
      entityType="orders"
      customColumns={customColumns}
    />
  );
}
```

Available column properties:
- `width`: Fixed width in pixels
- `align`: Column alignment (`'left'`, `'center'`, `'right'`)
- `fixed`: Pin column (`'left'` or `'right'`)
- `ellipsis`: Truncate text with ellipsis (boolean or object)
- `render`: Custom render function `(value, record) => ReactNode`
- `sorter`: Custom sort function or boolean
- Any other [Ant Design Table Column](https://ant.design/components/table#column) property

### Option 2: Auto-Applied Renderers

Edit `/app/console/view_filter/columnRenderers.tsx` to add entity-specific renderers:

```tsx
export const orderRenderers = {
  // Order status with colored tag
  'status.order': (value: any) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'orange', label: 'Pending' },
      confirmed: { color: 'blue', label: 'Confirmed' },
      delivered: { color: 'green', label: 'Delivered' },
      cancelled: { color: 'red', label: 'Cancelled' },
    };

    const status = statusMap[value] || { color: 'default', label: value };
    return <Tag color={status.color}>{status.label}</Tag>;
  },

  // Format currency
  'total': (value: any) => {
    if (value === null || value === undefined) return '--';
    return `$${Number(value).toFixed(2)}`;
  },

  // Format date
  'created_at': (value: any) => {
    if (!value) return '--';
    return dayjs(value).format('MMM D, YYYY h:mm A');
  },

  // Product image
  'product.image': (value: any, record: any) => {
    const imageUrl = value || record.product?.images?.[0];
    if (!imageUrl) return '--';
    return <Image src={imageUrl} width={50} height={50} style={{ objectFit: 'cover' }} />;
  },
};

// Export in entityColumnRenderers
export const entityColumnRenderers = {
  products: productRenderers,
  orders: orderRenderers,  // ← Add your entity here
  users: userRenderers,
};
```

These renderers are **automatically applied** to columns matching the field key!

### Option 3: Page-Level Custom Renderers (Backward Compatibility)

Pass custom renderers as a prop (overrides auto-applied renderers):

```tsx
import { DynamicViewFilter } from '@/app/console/view_filter/components/DynamicViewFilter';
import { Tag } from 'antd';

const customRenderers = {
  'status': (value: any) => <Tag color="green">{value}</Tag>,
  'priority': (value: any) => <Tag color={value === 'high' ? 'red' : 'blue'}>{value}</Tag>,
};

export default function OrdersPage() {
  return (
    <DynamicViewFilter
      entityType="orders"
      customRenderers={customRenderers}  // ← Pass custom renderers
    />
  );
}
```

**Note**: `customRenderers` only allows passing render functions. For full column configuration (width, align, fixed, etc.), use `customColumns` instead (Option 1).

### Pre-Built Renderers

Use common renderers from `columnRenderers.tsx`:

```tsx
import { renderDate, renderCurrency, renderStatus, renderImage } from '@/app/console/view_filter/columnRenderers';

export const myEntityRenderers = {
  'created_at': renderDate,
  'updated_at': renderDateTime,
  'price': renderCurrency,
  'status': renderStatus,
  'is_active': renderBoolean,
  'thumbnail': renderImage,
  'tags': renderTags,
};
```

Available pre-built renderers:
- `renderDate` - Format as "MMM D, YYYY"
- `renderDateTime` - Format as "MMM D, YYYY h:mm A"
- `renderCurrency` - Format as "$123.45"
- `renderBoolean` - Show as Yes/No tags
- `renderStatus` - Colored status tags
- `renderImage` - Image thumbnail
- `renderAvatar` - User avatar
- `renderTags` - Array of tags
- `renderTruncatedText(length)` - Truncate with tooltip

---

## Deploying on a Page

### Basic Deployment

```tsx
// /app/console/orders/page.tsx
'use client';

import { DynamicViewFilter } from '@/app/console/view_filter/components/DynamicViewFilter';
import { Page } from '@_/template';

export default function OrdersPage() {
  return (
    <Page>
      <DynamicViewFilter entityType="orders" />
    </Page>
  );
}
```

### With Custom Column Configurations

```tsx
'use client';

import { DynamicViewFilter } from '@/app/console/view_filter/components/DynamicViewFilter';
import { Page } from '@_/template';
import { Tag } from 'antd';

const customColumns = {
  'priority': {
    width: 100,
    align: 'center',
    render: (value: any) => <Tag color={value === 'high' ? 'red' : 'blue'}>{value}</Tag>,
  },
  'total': {
    width: 120,
    align: 'right',
    fixed: 'right',
    render: (value: any) => `$${Number(value).toFixed(2)}`,
  },
};

export default function OrdersPage() {
  return (
    <Page>
      <DynamicViewFilter
        entityType="orders"
        customColumns={customColumns}
      />
    </Page>
  );
}
```

### With Custom Data Fetch (Advanced)

If you need custom data fetching logic:

```tsx
const customDataFetch = async (filters: any, page: number, limit: number) => {
  // Your custom API call
  const response = await fetch(`/api/custom-orders?page=${page}&limit=${limit}`);
  return response.json();
};

export default function OrdersPage() {
  return (
    <DynamicViewFilter
      entityType="orders"
      customDataFetch={customDataFetch}
    />
  );
}
```

---

## Troubleshooting

### No Data Showing

**Problem**: Table is empty or shows "No data"

**Solutions**:
1. Check if MongoDB collection name matches entity type:
   - Entity type `orders` → Collection should be named `Order` (singular, capitalized)
   - Check `/box_v3_happi_backend/src/graphql/view_filters/db.js` → `getEntityModel()`

2. Verify entity config exists:
   - Go to `/console/view_manager`
   - Check if your entity is listed

3. Create a default view:
   - Click "Add view" on the page
   - Select default columns and save

### Custom Renderers Not Working

**Problem**: Custom renderers not being applied

**Solutions**:
1. **For auto-applied renderers**:
   - Check field key matches exactly (case-sensitive)
   - Verify entity type is exported in `entityColumnRenderers`

2. **For page-level renderers**:
   - Pass `customRenderers` prop to DynamicViewFilter
   - Ensure column key matches exactly

3. **For full column configurations**:
   - Pass `customColumns` prop to DynamicViewFilter
   - Ensure column key matches exactly
   - Custom columns completely override base configuration

4. **Check render priority**:
   - Priority 1: `customColumns` prop (highest - includes width, align, render, etc.)
   - Priority 2: `customRenderers` prop (render function only, for backward compatibility)
   - Priority 3: Field definition renderer
   - Priority 4: Entity-specific renderer (auto-applied)
   - Priority 5: Default renderer

### Filters Not Working

**Problem**: Applying filters doesn't filter data

**Solutions**:
1. Check if fields are marked as "Is Filterable" in entity config
2. Verify field keys match your MongoDB schema
3. Check browser console for GraphQL errors
4. Ensure backend resolver `/box_v3_happi_backend/src/graphql/view_filters/db.js` → `convertFiltersToMongoQuery()` supports your operators

### Custom Renderer Examples

#### Status Badge
```tsx
'status': (value: any) => {
  const colors = {
    active: 'green',
    pending: 'orange',
    inactive: 'red',
  };
  return <Tag color={colors[value] || 'default'}>{value}</Tag>;
}
```

#### Price Formatting
```tsx
'price': (value: any) => {
  if (!value) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}
```

#### Nested Object
```tsx
'customer.name': (value: any, record: any) => {
  const name = record.customer?.name;
  const email = record.customer?.email;
  return (
    <div>
      <div>{name}</div>
      <div style={{ color: '#999', fontSize: 12 }}>{email}</div>
    </div>
  );
}
```

#### Image Gallery
```tsx
'images': (value: any) => {
  if (!Array.isArray(value) || value.length === 0) return '--';
  return (
    <Image.PreviewGroup>
      {value.slice(0, 3).map((img, i) => (
        <Image key={i} src={img} width={40} height={40} />
      ))}
    </Image.PreviewGroup>
  );
}
```

---

## Backend Model Mapping

Make sure your entity type maps to the correct Mongoose model:

Edit `/box_v3_happi_backend/src/graphql/view_filters/db.js`:

```javascript
function getEntityModel(entityType) {
  const modelMap = {
    'products': 'Product',
    'orders': 'Order',
    'users': 'User',
    'customers': 'Customer',  // ← Add your entity here
    // Add more as needed
  };

  const modelName = modelMap[entityType];
  return mongoose.model(modelName);
}
```

---

## Summary

1. **Configure Entity** in View Manager (`/console/view_manager`)
2. **Add Custom Renderers** in `columnRenderers.tsx` (optional)
3. **Deploy Component** with `<DynamicViewFilter entityType="orders" />`
4. **Test** by creating a view and filtering data

For help, check the example implementations:
- `/app/console/view_filter/products_page/page.tsx` (products example)
- `/app/console/view_filter/columnRenderers.tsx` (render examples)
