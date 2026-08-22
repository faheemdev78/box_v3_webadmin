'use client';

import { useRef } from 'react';
import { Button, Select, Space, Typography } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { FilterCondition, FilterField, FilterGroup, FilterLogic } from './types';
import { findField, isConditionBlank, isConditionComplete, isTreeComplete, pruneBlankConditions, treeIncompleteReason } from './completeness';
import { emptyCondition, emptyGroup } from './clone';
import { operatorLabel } from './operators';
import { ValueInput } from './ValueInput';

const { Text } = Typography;

export type FilterChangeKind = 'text' | 'number' | 'id' | 'select' | 'date' | 'operator' | 'logic';

type Props = {
  fields: FilterField[];
  groups: FilterGroup[];
  onChange: (groups: FilterGroup[], kind: FilterChangeKind) => void;
  getPopupContainer?: (trigger?: HTMLElement) => HTMLElement;
  showDone?: boolean;
  onDone?: () => void;
  compact?: boolean;
};

export function FilterEditor({
  fields,
  groups,
  onChange,
  getPopupContainer,
  showDone = false,
  onDone,
  compact = false,
}: Props) {
  const placeholderRef = useRef<FilterGroup | null>(null);
  if (!groups.length) {
    if (!placeholderRef.current) placeholderRef.current = emptyGroup();
  } else {
    placeholderRef.current = null;
  }
  const working = groups.length ? groups : [placeholderRef.current as FilterGroup];
  const fieldOptions = fields.filter((field) => field.isFilterable !== false).map((field) => ({
    label: field.group ? `${field.group} / ${field.label}` : field.label,
    value: field.key,
  }));

  const updateGroups = (next: FilterGroup[], kind: FilterChangeKind) => onChange(next, kind);

  const ensureGroups = () => (groups.length ? groups : working);

  const patchCondition = (groupId: string, conditionId: string, patch: Partial<FilterCondition>, kind: FilterChangeKind) => {
    const source = ensureGroups();
    updateGroups(source.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        conditions: group.conditions.map((condition) => (
          condition.id === conditionId ? { ...condition, ...patch } : condition
        )),
      };
    }), kind);
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    const next = ensureGroups()
      .map((group) => {
        if (group.id !== groupId) return group;
        return { ...group, conditions: group.conditions.filter((condition) => condition.id !== conditionId) };
      })
      .filter((group) => group.conditions.length > 0);
    updateGroups(next, 'operator');
  };

  const addCondition = (groupId: string) => {
    updateGroups(ensureGroups().map((group) => (
      group.id === groupId ? { ...group, conditions: [...group.conditions, emptyCondition()] } : group
    )), 'operator');
  };

  const addGroup = (joinLogic: FilterLogic) => {
    const source = groups.length ? groups : working;
    const next = source.map((group, index) => (
      index === source.length - 1 ? { ...group, joinLogic } : group
    ));
    updateGroups([...next, emptyGroup(joinLogic)], 'logic');
  };

  const incomplete = treeIncompleteReason(working, fields);
  const canApply = isTreeComplete(working, fields);

  const handleDone = () => {
    if (!canApply) return;
    onChange(pruneBlankConditions(working), 'operator');
    onDone?.();
  };

  return (
    <div style={{ width: compact ? '100%' : 720, maxWidth: '100%' }}>
      <Text strong>Where</Text>
      <div style={{ marginTop: 8, maxHeight: compact ? 'none' : 420, overflow: compact ? 'visible' : 'auto' }}>
        {working.map((group, groupIndex) => (
          <div key={group.id} style={{ marginBottom: 12 }}>
            {groupIndex > 0 && (
              <div style={{ margin: '8px 0' }}>
                <Select
                  size="small"
                  value={working[groupIndex - 1]?.joinLogic || 'AND'}
                  style={{ width: 90 }}
                  options={[{ value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }]}
                  getPopupContainer={getPopupContainer}
                  onChange={(joinLogic) => {
                    updateGroups(ensureGroups().map((item, index) => (
                      index === groupIndex - 1 ? { ...item, joinLogic } : item
                    )), 'logic');
                  }}
                />
              </div>
            )}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, background: '#fafafa' }}>
              {group.conditions.map((condition, condIndex) => {
                const field = findField(fields, condition.field);
                const operators = (field?.operators || []).map((operator) => ({
                  value: operator,
                  label: operatorLabel(operator),
                }));
                const blank = isConditionBlank(condition);
                const complete = isConditionComplete(condition, field);
                return (
                  <div key={condition.id} style={{ marginBottom: 8 }}>
                    {condIndex > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <Select
                          size="small"
                          value={group.logic}
                          style={{ width: 90 }}
                          options={[{ value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }]}
                          getPopupContainer={getPopupContainer}
                          onChange={(logic) => {
                            updateGroups(ensureGroups().map((item) => item.id === group.id ? { ...item, logic } : item), 'logic');
                          }}
                        />
                      </div>
                    )}
                    <Space wrap align="start" style={{ width: '100%' }}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Field"
                        style={{ width: 200 }}
                        value={condition.field || undefined}
                        options={fieldOptions}
                        getPopupContainer={getPopupContainer}
                        onChange={(nextField) => {
                          const next = findField(fields, nextField);
                          const nextOp = next?.operators?.[0] || '';
                          patchCondition(group.id, condition.id, { field: nextField, operator: nextOp as any, value: null }, 'operator');
                        }}
                      />
                      <Select
                        placeholder="Operator"
                        style={{ width: 170 }}
                        value={condition.operator || undefined}
                        options={operators}
                        disabled={!field}
                        getPopupContainer={getPopupContainer}
                        onChange={(operator) => patchCondition(group.id, condition.id, { operator, value: null }, 'operator')}
                      />
                      <ValueInput
                        field={field}
                        condition={condition}
                        getPopupContainer={getPopupContainer}
                        onChange={(value, kind) => patchCondition(group.id, condition.id, { value }, kind)}
                      />
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => removeCondition(group.id, condition.id)}
                      />
                      {!blank && !complete && <Text type="danger" style={{ fontSize: 12 }}>Incomplete</Text>}
                    </Space>
                  </div>
                );
              })}
              <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => addCondition(group.id)}>
                Add condition
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Space wrap style={{ marginTop: 8 }}>
        <Button size="small" icon={<PlusOutlined />} onClick={() => addGroup('AND')}>Add AND group</Button>
        <Button size="small" icon={<PlusOutlined />} onClick={() => addGroup('OR')}>Add OR group</Button>
      </Space>
      {incomplete && <div style={{ marginTop: 8 }}><Text type="danger">{incomplete}</Text></div>}
      {showDone && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button type="primary" disabled={!canApply} onClick={handleDone}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
