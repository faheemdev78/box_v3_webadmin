/**
 * Custom Column Renderers
 *
 * This file contains custom render functions for specific entity types and fields.
 * These renderers control how data is displayed in the table columns.
 *
 * Usage:
 * 1. Define your custom render function below
 * 2. Export it in the entityColumnRenderers object
 * 3. The DynamicViewFilter will automatically use it when rendering the column
 */

import React from 'react';
import { Tag, Avatar, Image, Tooltip } from 'antd';
import dayjs from 'dayjs';

// ==========================================
// Common Render Functions
// ==========================================

/**
 * Render a date field
 */
export const renderDate = (value: any) => {
  if (!value) return '--';
  return dayjs(value).format('MMM D, YYYY');
};

/**
 * Render a datetime field
 */
export const renderDateTime = (value: any) => {
  if (!value) return '--';
  return dayjs(value).format('MMM D, YYYY h:mm A');
};

/**
 * Render a currency field
 */
export const renderCurrency = (value: any) => {
  if (value === null || value === undefined) return '--';
  return `$${Number(value).toFixed(2)}`;
};

/**
 * Render a boolean as Yes/No
 */
export const renderBoolean = (value: any) => {
  if (value === null || value === undefined) return '--';
  return value ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>;
};

/**
 * Render a status tag
 */
export const renderStatus = (value: any) => {
  if (!value) return '--';

  const statusColors: Record<string, string> = {
    active: 'green',
    inactive: 'red',
    pending: 'orange',
    draft: 'gray',
    published: 'blue',
    archived: 'default',
  };

  return <Tag color={statusColors[value.toLowerCase()] || 'default'}>{value}</Tag>;
};

/**
 * Render an image thumbnail
 */
export const renderImage = (value: any) => {
  if (!value) return '--';
  return <Image src={value} width={50} height={50} style={{ objectFit: 'cover' }} alt="Image" />;
};

/**
 * Render an avatar
 */
export const renderAvatar = (value: any, record: any) => {
  if (!value) return <Avatar>{record.name?.[0] || '?'}</Avatar>;
  return <Avatar src={value} />;
};

/**
 * Render a truncated text with tooltip
 */
export const renderTruncatedText = (maxLength: number) => {
  const TruncatedText = (value: any) => {
    if (!value) return '--';
    const text = String(value);
    if (text.length <= maxLength) return text;

    return (
      <Tooltip title={text}>
        <span>{text.substring(0, maxLength)}...</span>
      </Tooltip>
    );
  };
  TruncatedText.displayName = 'TruncatedText';
  return TruncatedText;
};

/**
 * Render an array of tags
 */
export const renderTags = (value: any) => {
  if (!Array.isArray(value) || value.length === 0) return '--';
  return (
    <>
      {value.map((tag, index) => (
        <Tag key={index}>{tag}</Tag>
      ))}
    </>
  );
};

// ==========================================
// Entity-Specific Renderers
// ==========================================

/**
 * Products Entity Renderers
 */
export const productRenderers = {
  // Product image
  'image': (value: any, record: any) => {
    const imageUrl = value || record.images?.[0] || record.thumbnail;
    if (!imageUrl) return '--';
    return <Image src={imageUrl} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} alt="Product" />;
  },

  // Product status
  'status': (value: any) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      active: { color: 'green', label: 'Active' },
      inactive: { color: 'red', label: 'Inactive' },
      draft: { color: 'gray', label: 'Draft' },
      out_of_stock: { color: 'orange', label: 'Out of Stock' },
    };

    const status = statusMap[value] || { color: 'default', label: value };
    return <Tag color={status.color}>{status.label}</Tag>;
  },

  // Product price
  'price': renderCurrency,
  'sale_price': renderCurrency,
  'cost': renderCurrency,

  // Product stock
  'stock': (value: any) => {
    if (value === null || value === undefined) return '--';
    const numValue = Number(value);
    const color = numValue > 10 ? 'green' : numValue > 0 ? 'orange' : 'red';
    return <Tag color={color}>{numValue}</Tag>;
  },

  // Product categories/tags
  'categories': renderTags,
  'tags': renderTags,

  // Created/Updated dates
  'created_at': renderDateTime,
  'updated_at': renderDateTime,
};

/**
 * Orders Entity Renderers
 */
export const orderRenderers = {
  // Order status
  'status.order': (value: any) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'orange', label: 'Pending' },
      confirmed: { color: 'blue', label: 'Confirmed' },
      processing: { color: 'cyan', label: 'Processing' },
      shipped: { color: 'purple', label: 'Shipped' },
      delivered: { color: 'green', label: 'Delivered' },
      cancelled: { color: 'red', label: 'Cancelled' },
      refunded: { color: 'gray', label: 'Refunded' },
    };

    const status = statusMap[value] || { color: 'default', label: value };
    return <Tag color={status.color}>{status.label}</Tag>;
  },

  // Payment status
  'status.payment': (value: any) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'orange', label: 'Pending' },
      paid: { color: 'green', label: 'Paid' },
      failed: { color: 'red', label: 'Failed' },
      refunded: { color: 'gray', label: 'Refunded' },
    };

    const status = statusMap[value] || { color: 'default', label: value };
    return <Tag color={status.color}>{status.label}</Tag>;
  },

  // Order total
  'total': renderCurrency,
  'subtotal': renderCurrency,
  'discount': renderCurrency,
  'tax': renderCurrency,

  // Order dates
  'created_at': renderDateTime,
  'updated_at': renderDateTime,
  'delivered_at': renderDateTime,
};

/**
 * Users Entity Renderers
 */
export const userRenderers = {
  // User avatar
  'avatar': renderAvatar,

  // User status
  'status': renderStatus,
  'is_active': renderBoolean,
  'is_verified': renderBoolean,

  // User dates
  'created_at': renderDateTime,
  'last_login': renderDateTime,
};

/**
 * Staff Entity Renderers
 */
export const staffRenderers = {
  // Staff avatar
  'avatar': renderAvatar,

  // Staff status
  'status': renderStatus,
  'is_active': renderBoolean,

  // Staff dates
  'created_at': renderDateTime,
  'last_login': renderDateTime,
};

// ==========================================
// Export All Renderers
// ==========================================

/**
 * Map of entity types to their column renderers
 *
 * Usage in DynamicViewFilter:
 * const renderers = entityColumnRenderers[entityType] || {};
 *
 * Then merge these with field definitions when displaying the table
 */
export const entityColumnRenderers: Record<string, Record<string, (value: any, record?: any) => React.ReactNode>> = {
  products: productRenderers,
  orders: orderRenderers,
  users: userRenderers,
  staff: staffRenderers,
};

/**
 * Get column renderer for a specific entity and field
 */
export function getColumnRenderer(entityType: string, fieldKey: string) {
  return entityColumnRenderers[entityType]?.[fieldKey];
}

// ==========================================
// Full Column Configuration Objects
// ==========================================

/**
 * Full column configuration objects (with width, align, fixed, ellipsis, etc.)
 *
 * Usage example:
 * <DynamicViewFilter
 *   entityType="orders"
 *   customColumns={orderColumnConfigs}
 * />
 */

/**
 * Products Entity Column Configurations
 */
export const productColumnConfigs = {
  'image': {
    width: 80,
    align: 'center' as const,
    render: (value: any, record: any) => {
      const imageUrl = value || record.images?.[0] || record.thumbnail;
      if (!imageUrl) return '--';
      return <Image src={imageUrl} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} alt="Product" />;
    }
  },
  'title': {
    width: 200,
    ellipsis: true,
  },
  'price': {
    width: 100,
    align: 'right' as const,
    render: renderCurrency,
  },
  'stock': {
    width: 80,
    align: 'center' as const,
    render: (value: any) => {
      if (value === null || value === undefined) return '--';
      const numValue = Number(value);
      const color = numValue > 10 ? 'green' : numValue > 0 ? 'orange' : 'red';
      return <Tag color={color}>{numValue}</Tag>;
    }
  },
};

/**
 * Orders Entity Column Configurations
 */
export const orderColumnConfigs = {
  'order_number': {
    width: 150,
    fixed: 'left' as const,
  },
  'status.order': {
    width: 120,
    align: 'center' as const,
    render: (value: any) => {
      const statusMap: Record<string, { color: string; label: string }> = {
        pending: { color: 'orange', label: 'Pending' },
        confirmed: { color: 'blue', label: 'Confirmed' },
        processing: { color: 'cyan', label: 'Processing' },
        shipped: { color: 'purple', label: 'Shipped' },
        delivered: { color: 'green', label: 'Delivered' },
        cancelled: { color: 'red', label: 'Cancelled' },
        refunded: { color: 'gray', label: 'Refunded' },
      };

      const status = statusMap[value] || { color: 'default', label: value };
      return <Tag color={status.color}>{status.label}</Tag>;
    }
  },
  'status.payment': {
    width: 120,
    align: 'center' as const,
    render: (value: any) => {
      const statusMap: Record<string, { color: string; label: string }> = {
        pending: { color: 'orange', label: 'Pending' },
        paid: { color: 'green', label: 'Paid' },
        failed: { color: 'red', label: 'Failed' },
        refunded: { color: 'gray', label: 'Refunded' },
      };

      const status = statusMap[value] || { color: 'default', label: value };
      return <Tag color={status.color}>{status.label}</Tag>;
    }
  },
  'total': {
    width: 120,
    align: 'right' as const,
    render: renderCurrency,
  },
  'created_at': {
    width: 180,
    render: renderDateTime,
  },
};

/**
 * Users Entity Column Configurations
 */
export const userColumnConfigs = {
  'avatar': {
    width: 60,
    align: 'center' as const,
    render: renderAvatar,
  },
  'email': {
    width: 200,
    ellipsis: true,
  },
  'is_active': {
    width: 100,
    align: 'center' as const,
    render: renderBoolean,
  },
};

/**
 * Map of entity types to their full column configurations
 */
export const entityColumnConfigs: Record<string, Record<string, Partial<any>>> = {
  products: productColumnConfigs,
  orders: orderColumnConfigs,
  users: userColumnConfigs,
};