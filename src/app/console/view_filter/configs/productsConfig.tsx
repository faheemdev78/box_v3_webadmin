import React from 'react';
import { Tag, Space } from 'antd';
import { FilterComponentConfig, FieldDefinition, ColumnDefinition } from '../types';

// Field definitions for products
const PRODUCT_FIELDS: FieldDefinition[] = [
  {
    key: 'title',
    label: 'Product Title',
    type: 'text',
    group: 'Product Information',
    operators: ['equals', 'contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    isFilterable: true,
    isSortable: true,
    isSearchable: true
  },
  {
    key: 'slug',
    label: 'Slug',
    type: 'text',
    group: 'Product Information',
    operators: ['equals', 'contains', 'starts_with'],
    isFilterable: true,
    isSortable: true
  },
  {
    key: 'barcode',
    label: 'Barcode',
    type: 'text',
    group: 'Product Information',
    operators: ['equals', 'contains'],
    isFilterable: true,
    isSortable: true,
    isSearchable: true
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    group: 'Product Information',
    operators: ['equals', 'not_equals', 'in', 'not_in'],
    options: [
      { label: 'Online', value: 'online' },
      { label: 'Offline', value: 'offline' },
      { label: 'Draft', value: 'draft' }
    ],
    isFilterable: true,
    isSortable: true,
    render: (value) => {
      const colorMap: Record<string, string> = {
        online: 'green',
        offline: 'red',
        draft: 'orange'
      };
      return <Tag color={colorMap[value] || 'default'}>{value}</Tag>;
    }
  },
  {
    key: 'brand.title',
    label: 'Brand',
    type: 'text',
    group: 'Product Information',
    operators: ['equals', 'contains', 'in', 'is_empty', 'is_not_empty'],
    isFilterable: true,
    isSortable: true,
    dataPath: 'brand.title'
  },
  {
    key: 'type.title',
    label: 'Product Type',
    type: 'text',
    group: 'Product Information',
    operators: ['equals', 'contains', 'in'],
    isFilterable: true,
    isSortable: true,
    dataPath: 'type.title'
  },
  {
    key: 'categories',
    label: 'Categories',
    type: 'array',
    group: 'Product Information',
    operators: ['contains', 'in'],
    isFilterable: true,
    isSortable: false,
    render: (value: any[]) => {
      if (!value || value.length === 0) return '--';
      return (
        <Space size={4} wrap>
          {value.map((cat, idx) => (
            <Tag key={idx}>{cat.title}</Tag>
          ))}
        </Space>
      );
    }
  },
  {
    key: 'origon',
    label: 'Origin',
    type: 'select',
    group: 'Product Information',
    operators: ['equals', 'in', 'not_in'],
    options: [
      { label: 'Pakistan', value: 'PK' },
      { label: 'USA', value: 'US' },
      { label: 'UK', value: 'UK' },
      { label: 'China', value: 'CN' }
    ],
    isFilterable: true,
    isSortable: true
  },
  {
    key: 'is_expirable',
    label: 'Is Expirable',
    type: 'boolean',
    group: 'Product Properties',
    operators: ['is_true', 'is_false'],
    isFilterable: true,
    isSortable: true,
    render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
  },
  {
    key: 'is_temp_senctive',
    label: 'Temperature Sensitive',
    type: 'boolean',
    group: 'Product Properties',
    operators: ['is_true', 'is_false'],
    isFilterable: true,
    isSortable: true,
    render: (value) => <Tag color={value ? 'orange' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
  },
  {
    key: 'fit_for_dispatch',
    label: 'Fit for Dispatch',
    type: 'boolean',
    group: 'Product Properties',
    operators: ['is_true', 'is_false'],
    isFilterable: true,
    isSortable: true,
    render: (value) => <Tag color={value ? 'blue' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
  },
  {
    key: 'have_variations',
    label: 'Has Variations',
    type: 'boolean',
    group: 'Product Properties',
    operators: ['is_true', 'is_false'],
    isFilterable: true,
    isSortable: true,
    render: (value) => value ? 'Yes' : 'No'
  },
  {
    key: 'variations_count',
    label: 'Variations Count',
    type: 'number',
    group: 'Product Properties',
    operators: ['equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal'],
    isFilterable: true,
    isSortable: true
  },
  {
    key: 'cost',
    label: 'Cost',
    type: 'number',
    group: 'Pricing',
    operators: ['equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal'],
    isFilterable: true,
    isSortable: true,
    render: (value) => value ? `Rs. ${value.toLocaleString()}` : '--'
  },
  {
    key: 'cart_limit',
    label: 'Cart Limit',
    type: 'number',
    group: 'Product Properties',
    operators: ['equals', 'greater_than', 'less_than'],
    isFilterable: true,
    isSortable: true
  },
  {
    key: 'stock_level.min',
    label: 'Min Stock Level',
    type: 'number',
    group: 'Stock',
    operators: ['equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal'],
    isFilterable: true,
    isSortable: true,
    dataPath: 'stock_level.min'
  },
  {
    key: 'stock_level.max',
    label: 'Max Stock Level',
    type: 'number',
    group: 'Stock',
    operators: ['equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal'],
    isFilterable: true,
    isSortable: true,
    dataPath: 'stock_level.max'
  },
  {
    key: 'created_at',
    label: 'Created Date',
    type: 'date',
    group: 'Dates',
    operators: ['equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal'],
    isFilterable: true,
    isSortable: true,
    render: (value) => value?.$date ? new Date(value.$date).toLocaleDateString() : '--'
  },
  {
    key: 'updated_at',
    label: 'Updated Date',
    type: 'date',
    group: 'Dates',
    operators: ['equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal'],
    isFilterable: true,
    isSortable: true,
    render: (value) => value?.$date ? new Date(value.$date).toLocaleDateString() : '--'
  },
  {
    key: 'published_at',
    label: 'Published Date',
    type: 'date',
    group: 'Dates',
    operators: ['equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'],
    isFilterable: true,
    isSortable: true,
    render: (value) => value?.$date ? new Date(value.$date).toLocaleDateString() : '--'
  },
  {
    key: 'tags',
    label: 'Tags',
    type: 'text',
    group: 'Product Information',
    operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
    isFilterable: true,
    isSortable: false,
    render: (value) => {
      if (!value) return '--';
      const tags = value.split(',').map((t: string) => t.trim());
      return (
        <Space size={4} wrap>
          {tags.map((tag: string, idx: number) => (
            <Tag key={idx}>{tag}</Tag>
          ))}
        </Space>
      );
    }
  }
];

// Available columns for products table
const PRODUCT_COLUMNS: ColumnDefinition[] = [
  {
    key: 'title',
    label: 'Product Title',
    visible: true,
    sortable: true,
    frozen: false,
    group: 'Product Information'
  },
  {
    key: 'barcode',
    label: 'Barcode',
    visible: true,
    sortable: true,
    frozen: false,
    group: 'Product Information'
  },
  {
    key: 'status',
    label: 'Status',
    visible: true,
    sortable: true,
    frozen: false,
    group: 'Product Information'
  },
  {
    key: 'brand.title',
    label: 'Brand',
    visible: true,
    sortable: true,
    frozen: false,
    group: 'Product Information'
  },
  {
    key: 'type.title',
    label: 'Type',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Information'
  },
  {
    key: 'categories',
    label: 'Categories',
    visible: true,
    sortable: false,
    frozen: false,
    group: 'Product Information'
  },
  {
    key: 'origon',
    label: 'Origin',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Information'
  },
  {
    key: 'cost',
    label: 'Cost',
    visible: true,
    sortable: true,
    frozen: false,
    group: 'Pricing'
  },
  {
    key: 'is_expirable',
    label: 'Expirable',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Properties'
  },
  {
    key: 'is_temp_senctive',
    label: 'Temp. Sensitive',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Properties'
  },
  {
    key: 'fit_for_dispatch',
    label: 'Fit for Dispatch',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Properties'
  },
  {
    key: 'have_variations',
    label: 'Has Variations',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Properties'
  },
  {
    key: 'variations_count',
    label: 'Variations Count',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Properties'
  },
  {
    key: 'cart_limit',
    label: 'Cart Limit',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Product Properties'
  },
  {
    key: 'stock_level.min',
    label: 'Min Stock',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Stock'
  },
  {
    key: 'stock_level.max',
    label: 'Max Stock',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Stock'
  },
  {
    key: 'created_at',
    label: 'Created Date',
    visible: true,
    sortable: true,
    frozen: false,
    group: 'Dates'
  },
  {
    key: 'updated_at',
    label: 'Updated Date',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Dates'
  },
  {
    key: 'published_at',
    label: 'Published Date',
    visible: false,
    sortable: true,
    frozen: false,
    group: 'Dates'
  },
  {
    key: 'tags',
    label: 'Tags',
    visible: false,
    sortable: false,
    frozen: false,
    group: 'Product Information'
  }
];

// Products configuration
export const productsConfig: FilterComponentConfig = {
  entityType: 'products',
  entityLabel: 'Products',
  entityLabelSingular: 'Product',
  fields: PRODUCT_FIELDS,
  availableColumns: PRODUCT_COLUMNS,
  defaultColumns: ['title', 'barcode', 'status', 'brand.title', 'categories', 'cost', 'created_at'],
  defaultSort: { field: 'created_at', direction: 'desc' },
  rowKey: '_id.$oid'
};