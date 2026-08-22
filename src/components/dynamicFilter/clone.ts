import type { FilterCondition, FilterGroup, FilterLogic } from './types';

export function stripTypename<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => stripTypename(item)) as T;
  if (value && typeof value === 'object') {
    const next: Record<string, any> = {};
    Object.entries(value as Record<string, any>).forEach(([key, nested]) => {
      if (key === '__typename') return;
      next[key] = stripTypename(nested);
    });
    return next as T;
  }
  return value;
}

export function cloneJson<T>(value: T): T {
  return stripTypename(JSON.parse(JSON.stringify(value ?? null)));
}

export function sameTree(a: any, b: any) {
  return JSON.stringify(normalizeTree(a)) === JSON.stringify(normalizeTree(b));
}

function normalizeTree(groups: any) {
  const cloned = cloneJson(groups || []);
  if (!Array.isArray(cloned)) return [];
  return cloned.map((group: any) => ({
    logic: group.logic || 'AND',
    joinLogic: group.joinLogic || 'AND',
    conditions: (group.conditions || []).map((condition: any) => ({
      field: condition.field || '',
      operator: condition.operator || '',
      value: condition.value ?? null,
    })),
  }));
}

export function newId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyCondition(): FilterCondition {
  return { id: newId('c'), field: '', operator: '', value: null };
}

export function emptyGroup(joinLogic: FilterLogic = 'AND'): FilterGroup {
  return { id: newId('g'), logic: 'AND', joinLogic, conditions: [emptyCondition()] };
}
