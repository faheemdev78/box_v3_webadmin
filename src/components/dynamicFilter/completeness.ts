import { VALUE_OPTIONAL_OPERATORS, type FilterCondition, type FilterField, type FilterGroup } from './types';

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

function isBlank(value: any) {
  return value === null || value === undefined || value === '';
}

function asArray(value: any): any[] | null {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray(value.values)) return value.values;
  return null;
}

function betweenBounds(value: any) {
  if (Array.isArray(value) && value.length === 2) return { from: value[0], to: value[1] };
  if (value && typeof value === 'object') {
    return {
      from: value.from ?? value.min ?? value.start ?? value.gte,
      to: value.to ?? value.max ?? value.end ?? value.lte,
    };
  }
  return { from: undefined, to: undefined };
}

export function findField(fields: FilterField[], key?: string) {
  if (!key) return undefined;
  return fields.find((field) => field.key === key || field.dataPath === key);
}

/** Unstarted row: user hasn't picked a field yet. Safe to ignore for query/save. */
export function isConditionBlank(condition?: FilterCondition) {
  return !condition?.field && !condition?.operator;
}

export function isConditionComplete(condition?: FilterCondition, field?: FilterField) {
  if (isConditionBlank(condition)) return false;
  if (!condition?.field || !condition?.operator) return false;
  if (field && Array.isArray(field.operators) && !field.operators.includes(condition.operator as any)) return false;
  if (VALUE_OPTIONAL_OPERATORS.includes(condition.operator as any)) return true;

  const value = condition.value;
  if (condition.operator === 'between') {
    const { from, to } = betweenBounds(value);
    return !isBlank(from) && !isBlank(to);
  }
  if (condition.operator === 'in' || condition.operator === 'not_in') {
    const list = asArray(value) || (typeof value === 'string' && value.trim() ? value.split(',').map((item) => item.trim()).filter(Boolean) : null);
    if (!list || !list.length) return false;
    if (field?.type === 'id') return list.every((item) => OBJECT_ID_RE.test(String(item)));
    return list.every((item) => !isBlank(item));
  }
  if (field?.type === 'id') return OBJECT_ID_RE.test(String(value || ''));
  if (Array.isArray(value)) return value.length > 0;
  return !isBlank(value);
}

export function pruneBlankConditions(groups?: FilterGroup[]): FilterGroup[] {
  return (groups || [])
    .map((group) => ({
      ...group,
      conditions: (group.conditions || []).filter((condition) => !isConditionBlank(condition)),
    }))
    .filter((group) => group.conditions.length > 0);
}

export function isTreeComplete(groups?: FilterGroup[], fields: FilterField[] = []) {
  const pruned = pruneBlankConditions(groups);
  if (!pruned.length) return true;
  return pruned.every((group) => (
    group.conditions.every((condition) => isConditionComplete(condition, findField(fields, condition.field)))
  ));
}

export function treeIncompleteReason(groups?: FilterGroup[], fields: FilterField[] = []) {
  const pruned = pruneBlankConditions(groups);
  if (!pruned.length) return null;
  for (let i = 0; i < pruned.length; i += 1) {
    const group = pruned[i];
    for (let j = 0; j < group.conditions.length; j += 1) {
      const condition = group.conditions[j];
      const field = findField(fields, condition.field);
      if (!isConditionComplete(condition, field)) {
        return `Finish or remove the incomplete ${field?.label || 'condition'}.`;
      }
    }
  }
  return null;
}

export function toQueryGroups(groups: FilterGroup[]) {
  return pruneBlankConditions(groups).map((group) => ({
    id: group.id,
    logic: group.logic || 'AND',
    joinLogic: group.joinLogic || 'AND',
    conditions: group.conditions.map((condition) => ({
      id: condition.id,
      field: condition.field,
      operator: condition.operator,
      value: condition.value ?? null,
    })),
  }));
}
