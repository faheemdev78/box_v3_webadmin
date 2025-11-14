# Unconfigured Columns Feature

## Overview
The DynamicViewFilter component now supports adding columns "on the fly" that are not part of the entity's configuration. These unconfigured columns will automatically appear at the end of the table, regardless of the view configuration.

## How It Works

### Configured vs Unconfigured Columns

1. **Configured Columns**: Columns defined in the entity configuration (via View Manager)
   - These columns respect the view's visibility settings
   - If hidden in the view configuration, they stay hidden
   - Can be toggled on/off via "Edit columns" modal

2. **Unconfigured Columns**: Columns passed via `customColumns` that are NOT in the entity configuration
   - Always displayed at the end of the table
   - Cannot be hidden through view configuration
   - Do not override existing column configurations

## Example Usage

```tsx
<DynamicViewFilter
  entityType="orders"
  customColumns={{
    // This is a configured column - respects view settings
    status: {
      width: 130,
      render: (status: string) => <Tag>{status}</Tag>
    },

    // This is an UNCONFIGURED column - always appears at the end
    actions: {
      title: 'Actions',
      width: 200,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Button onClick={() => handleDelete(record)}>Delete</Button>
        </Space>
      )
    }
  }}
/>
```

## Key Behavior

- **Configured column "status"**:
  - If "status" exists in entity config but is marked as hidden in the view → **stays hidden**
  - If "status" is visible in the view → uses the custom render function

- **Unconfigured column "actions"**:
  - Does NOT exist in entity config → **always displayed at the end**
  - Uses the provided title, width, and render function
  - Cannot be hidden through view configuration

## Implementation Details

The logic is implemented in `/Volumes/server_apps/box_v3/box_v3_webadmin/src/app/console/view_filter/utils.ts`:

1. First, process all configured columns based on `visibleColumnKeys`
2. Then, identify columns in `customColumns` that are NOT in the entity config
3. Append these unconfigured columns to the end of the column list

## Use Cases

- **Action columns**: Add edit/delete buttons without adding to entity config
- **Dynamic columns**: Add columns specific to certain pages/contexts
- **Temporary columns**: Add columns for testing without modifying entity config
- **Page-specific features**: Add functionality unique to a specific page

## Column Properties

Unconfigured columns support all standard Ant Design Table column properties:

- `title`: Column header text
- `width`: Column width (default: 150)
- `align`: Text alignment ('left', 'center', 'right')
- `fixed`: Fix column to left/right
- `render`: Custom render function
- `sorter`: Enable sorting
- And any other Ant Design column props
