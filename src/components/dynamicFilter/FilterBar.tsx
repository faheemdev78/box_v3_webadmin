'use client';

import { Button, Input, Space, Tag, Typography } from 'antd';
import { FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FilterField, FilterGroup } from './types';
import { findField, isConditionComplete } from './completeness';
import { operatorLabel } from './operators';
import { DATE_PRESETS } from './types';

const { Text } = Typography;

type Props = {
  fields: FilterField[];
  groups: FilterGroup[];
  searchTerm: string;
  onSearch: (value: string) => void;
  dirty: boolean;
  incomplete: boolean;
  incompleteReason?: string | null;
  onReset: () => void;
  extra?: React.ReactNode;
  onRemoveChip?: (conditionId: string) => void;
  builderOpen?: boolean;
  onToggleBuilder?: () => void;
  builderContent?: React.ReactNode;
};

function formatValue(value: any) {
  if (value == null || value === '') return '';
  const preset = DATE_PRESETS.find((item) => item.value === value);
  if (preset) return preset.label;
  if (Array.isArray(value)) return value.filter((item) => item != null && item !== '').join(', ');
  if (typeof value === 'object') {
    const from = value.from ?? value[0];
    const to = value.to ?? value[1];
    if (from != null || to != null) return `${from ?? ''} – ${to ?? ''}`;
  }
  return String(value);
}

export function FilterBar({
  fields,
  groups,
  searchTerm,
  onSearch,
  dirty,
  incomplete,
  incompleteReason,
  onReset,
  extra,
  onRemoveChip,
  builderOpen,
  onToggleBuilder,
  builderContent,
}: Props) {
  const chips = (groups || []).flatMap((group) => (
    group.conditions
      .filter((condition) => isConditionComplete(condition, findField(fields, condition.field)))
      .map((condition) => {
        const field = findField(fields, condition.field);
        const valueText = ['exists', 'not_exists', 'is_true', 'is_false'].includes(condition.operator)
          ? ''
          : formatValue(condition.value);
        return {
          key: condition.id,
          label: `${field?.label || condition.field} ${operatorLabel(condition.operator)}${valueText ? ` ${valueText}` : ''}`,
        };
      })
  ));

  return (
    <div style={{ padding: '8px 0' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Button
            size="small"
            type={builderOpen ? 'primary' : 'default'}
            icon={<PlusOutlined />}
            onClick={onToggleBuilder}
          >
            Filter
          </Button>
          {chips.map((chip) => (
            <Tag
              key={chip.key}
              icon={<FilterOutlined />}
              closable={Boolean(onRemoveChip)}
              onClose={(event) => {
                event.preventDefault();
                onRemoveChip?.(chip.key);
              }}
            >
              {chip.label}
            </Tag>
          ))}
          {!chips.length && <Text type="secondary">No filters</Text>}
          {dirty && <Button size="small" icon={<ReloadOutlined />} onClick={onReset}>Reset</Button>}
        </Space>
        <Space>
          <Input.Search
            allowClear
            placeholder="Search serial"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            style={{ width: 220 }}
          />
          {extra}
        </Space>
      </Space>
      {incomplete && incompleteReason && (
        <Text type="danger" style={{ fontSize: 12 }}>{incompleteReason}</Text>
      )}
      {builderOpen && builderContent && (
        <div style={{
          marginTop: 10,
          padding: 12,
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          background: '#fff',
        }}>
          {builderContent}
        </div>
      )}
    </div>
  );
}
