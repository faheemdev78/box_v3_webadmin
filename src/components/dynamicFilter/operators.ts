import type { FilterOperator } from './types';

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'is',
  not_equals: 'is not',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  greater_than: 'greater than',
  less_than: 'less than',
  greater_or_equal: 'greater or equal',
  less_or_equal: 'less or equal',
  between: 'is between',
  in: 'is any of',
  not_in: 'is none of',
  exists: 'exists',
  not_exists: 'does not exist',
  is_true: 'is true',
  is_false: 'is false',
};

export const OPERATORS_BY_TYPE: Record<string, FilterOperator[]> = {
  id: ['equals', 'not_equals', 'in', 'not_in', 'exists', 'not_exists'],
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'exists', 'not_exists'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between', 'exists', 'not_exists'],
  date: ['equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between', 'exists', 'not_exists'],
  select: ['equals', 'not_equals', 'in', 'not_in', 'exists', 'not_exists'],
  multiselect: ['in', 'not_in', 'contains', 'not_contains', 'exists', 'not_exists'],
  array: ['contains', 'not_contains', 'in', 'not_in', 'exists', 'not_exists'],
  boolean: ['is_true', 'is_false', 'exists', 'not_exists'],
};

export function operatorLabel(operator?: string) {
  if (!operator) return '';
  return OPERATOR_LABELS[operator as FilterOperator] || operator.replace(/_/g, ' ');
}
