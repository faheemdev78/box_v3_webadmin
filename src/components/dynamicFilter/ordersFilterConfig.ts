import type { FilterField } from './types';
import { OPERATORS_BY_TYPE } from './operators';

const stageOptions = [
  'pending', 'picking', 'picking-complete', 'till_verification',
  'ready-to-dispatch', 'delivering', 'delivered', 'completed', 'cancelled',
].map((value) => ({ label: value.replace(/-/g, ' ').replace(/_/g, ' '), value }));

const orderStatusOptions = [
  'new', 'pending', 'processing', 'delivered', 'cancelled', 'declined', 'returned', 'completed',
].map((value) => ({ label: value.replace(/-/g, ' '), value }));

const paymentOptions = [
  'pending', 'paid', 'failed', 'refunded', 'partial_refund',
].map((value) => ({ label: value.replace(/_/g, ' '), value }));

const dayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  .map((value) => ({ label: value, value }));

export const ORDERS_FILTER_FIELDS: FilterField[] = [
  { key: 'serial', label: 'Serial', type: 'text', group: 'Order', operators: OPERATORS_BY_TYPE.text, isFilterable: true, isSearchable: true },
  { key: '_id', label: 'Order ID', type: 'id', group: 'Order', operators: OPERATORS_BY_TYPE.id, isFilterable: true },
  { key: 'current_stage', label: 'Stage', type: 'select', group: 'Order', operators: OPERATORS_BY_TYPE.select, options: stageOptions, isFilterable: true },
  { key: 'status.order', label: 'Order status', type: 'select', group: 'Order', operators: OPERATORS_BY_TYPE.select, options: orderStatusOptions, isFilterable: true, dataPath: 'status.order' },
  { key: 'status.payment', label: 'Payment status', type: 'select', group: 'Order', operators: OPERATORS_BY_TYPE.select, options: paymentOptions, isFilterable: true, dataPath: 'status.payment' },
  { key: 'pickup_allow', label: 'Pickup allowed', type: 'boolean', group: 'Order', operators: OPERATORS_BY_TYPE.boolean, isFilterable: true },
  { key: 'createdAt', label: 'Created at', type: 'date', group: 'Order', operators: OPERATORS_BY_TYPE.date, isFilterable: true, isSortable: true },
  { key: 'updatedAt', label: 'Updated at', type: 'date', group: 'Order', operators: OPERATORS_BY_TYPE.date, isFilterable: true },

  { key: 'customer.name', label: 'Customer name', type: 'text', group: 'Customer', operators: OPERATORS_BY_TYPE.text, isFilterable: true, dataPath: 'customer.name' },
  { key: 'customer._id', label: 'Customer ID', type: 'id', group: 'Customer', operators: OPERATORS_BY_TYPE.id, isFilterable: true, dataPath: 'customer._id' },

  { key: 'zone.title', label: 'Zone', type: 'text', group: 'Store', operators: OPERATORS_BY_TYPE.text, isFilterable: true, dataPath: 'zone.title' },
  { key: 'zone._id_zone', label: 'Zone ID', type: 'id', group: 'Store', operators: OPERATORS_BY_TYPE.id, isFilterable: true, dataPath: 'zone._id_zone' },

  { key: 'picker.name', label: 'Picker name', type: 'text', group: 'Picking', operators: OPERATORS_BY_TYPE.text, isFilterable: true, dataPath: 'processing_stages.picking.handled_by.name' },
  { key: 'picker._id', label: 'Picker ID', type: 'id', group: 'Picking', operators: OPERATORS_BY_TYPE.id, isFilterable: true, dataPath: 'processing_stages.picking.handled_by._id' },
  { key: 'picker_baskets', label: 'Picker baskets', type: 'array', group: 'Picking', operators: OPERATORS_BY_TYPE.array, isFilterable: true, dataPath: 'processing_stages.picking.baskets.title' },
  { key: 'dispatch_baskets', label: 'Dispatch baskets', type: 'array', group: 'Till', operators: OPERATORS_BY_TYPE.array, isFilterable: true, dataPath: 'processing_stages.till_verification.baskets.title' },

  { key: 'delivery_slot.day', label: 'Delivery day', type: 'select', group: 'Delivery', operators: OPERATORS_BY_TYPE.select, options: dayOptions, isFilterable: true, dataPath: 'delivery_slot.day' },
  { key: 'grand_total', label: 'Grand total', type: 'number', group: 'Totals', operators: OPERATORS_BY_TYPE.number, isFilterable: true, dataPath: 'current_order.totals.grandTotal' },
  { key: 'item_qty', label: 'Item quantity', type: 'number', group: 'Totals', operators: OPERATORS_BY_TYPE.number, isFilterable: true, dataPath: 'current_order.totals.totalQuantity' },
];

export function getOrdersFilterFields() {
  return ORDERS_FILTER_FIELDS;
}
