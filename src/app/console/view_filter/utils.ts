import { FilterComponentConfig, FieldDefinition, ColumnDefinition } from './types';
import { getColumnRenderer } from './columnRenderers';

/**
 * Get nested value from an object using dot notation
 * Example: getNestedValue({ user: { name: 'John' } }, 'user.name') => 'John'
 */
export function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Generate Ant Design table columns from configuration
 */
export function generateTableColumns(
  config: FilterComponentConfig,
  visibleColumnKeys: string[],
  entityType?: string,
  customRenderers?: Record<string, (value: any, record?: any) => React.ReactNode>,
  customColumns?: Record<string, Partial<any>>
) {
  // Process configured columns
  const configuredColumns = visibleColumnKeys.map(columnKey => {
    const columnDef = config.availableColumns.find(col => col.key === columnKey);
    const fieldDef = config.fields.find(field => field.key === columnKey);

    if (!columnDef || !fieldDef) {
      return null;
    }

    // Base column configuration from entity config
    const baseColumn: any = {
      key: columnKey,
      dataIndex: columnKey,
      title: columnDef.label,
      sorter: columnDef.sortable,
      width: columnDef.width,
      render: (value: any, record: any) => {
        // Use dataPath if specified, otherwise use the column key
        const dataPath = fieldDef.dataPath || columnKey;
        const actualValue = getNestedValue(record, dataPath);

        // Priority 1: Custom renderer passed as prop (for backward compatibility)
        if (customRenderers && customRenderers[columnKey]) {
          return customRenderers[columnKey](actualValue, record);
        }

        // Priority 2: Field definition renderer
        if (fieldDef.render) {
          return fieldDef.render(actualValue, record);
        }

        // Priority 3: Entity-specific renderer from columnRenderers.tsx
        if (entityType) {
          const entityRenderer = getColumnRenderer(entityType, columnKey);
          if (entityRenderer) {
            return entityRenderer(actualValue, record);
          }
        }

        // Default rendering
        if (actualValue === null || actualValue === undefined) {
          return '--';
        }

        return actualValue;
      }
    };

    // Merge with custom column configuration if provided
    if (customColumns && customColumns[columnKey]) {
      const customConfig = customColumns[columnKey];

      // If custom config has a render function, wrap it to use dataPath
      if (customConfig.render) {
        const customRender = customConfig.render;
        return {
          ...baseColumn,
          ...customConfig,
          render: (value: any, record: any) => {
            const dataPath = fieldDef.dataPath || columnKey;
            const actualValue = getNestedValue(record, dataPath);
            return customRender(actualValue, record);
          }
        };
      }

      // Otherwise just merge the configurations
      return {
        ...baseColumn,
        ...customConfig
      };
    }

    return baseColumn;
  }).filter(Boolean); // Remove any null columns

  // Add unconfigured columns from customColumns
  // These are columns that exist in customColumns but not in the entity configuration
  if (customColumns) {
    const unconfiguredColumns = Object.keys(customColumns)
      .filter(columnKey => {
        // Check if this column is NOT in the entity config
        const isInConfig = config.availableColumns.some(col => col.key === columnKey);
        return !isInConfig;
      })
      .map(columnKey => {
        const customConfig = customColumns[columnKey];

        // Create a minimal column configuration for unconfigured columns
        const baseUnconfiguredColumn: any = {
          key: columnKey,
          dataIndex: columnKey,
          title: customConfig.title || columnKey, // Use provided title or default to key
          width: customConfig.width || 150,
          align: customConfig.align || 'left',
          render: customConfig.render || ((value: any) => value || '--')
        };

        // Merge with any other custom properties
        return {
          ...baseUnconfiguredColumn,
          ...customConfig
        };
      });

    // Append unconfigured columns at the end
    return [...configuredColumns, ...unconfiguredColumns];
  }

  return configuredColumns;
}

/**
 * Get unique row key from record
 */
export function getRowKey(record: any, rowKeyPath: string): string {
  const value = getNestedValue(record, rowKeyPath);
  return String(value);
}

/**
 * Filter data based on filter conditions
 * This is a basic client-side implementation - in production, filtering should happen server-side
 */
export function applyFilters(data: any[], filters: any[]): any[] {
  if (!filters || filters.length === 0) {
    return data;
  }

  return data.filter(record => {
    return filters.every(filter => {
      const fieldValue = getNestedValue(record, filter.field);

      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;

        case 'not_equals':
          return fieldValue !== filter.value;

        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());

        case 'not_contains':
          return !String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());

        case 'starts_with':
          return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());

        case 'ends_with':
          return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());

        case 'greater_than':
          return Number(fieldValue) > Number(filter.value);

        case 'less_than':
          return Number(fieldValue) < Number(filter.value);

        case 'greater_or_equal':
          return Number(fieldValue) >= Number(filter.value);

        case 'less_or_equal':
          return Number(fieldValue) <= Number(filter.value);

        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);

        case 'not_in':
          return Array.isArray(filter.value) && !filter.value.includes(fieldValue);

        case 'is_empty':
          return fieldValue === null || fieldValue === undefined || fieldValue === '';

        case 'is_not_empty':
          return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';

        case 'is_true':
          return fieldValue === true;

        case 'is_false':
          return fieldValue === false;

        default:
          return true;
      }
    });
  });
}

/**
 * Sort data based on sort configuration
 */
export function applySort(data: any[], sortField: string, sortDirection: 'asc' | 'desc'): any[] {
  if (!sortField) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, sortField);
    const bValue = getNestedValue(b, sortField);

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

    // Compare values
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Group fields by their group property
 */
export function groupFieldsByCategory(fields: FieldDefinition[]): Record<string, FieldDefinition[]> {
  return fields.reduce((acc, field) => {
    const group = field.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FieldDefinition[]>);
}