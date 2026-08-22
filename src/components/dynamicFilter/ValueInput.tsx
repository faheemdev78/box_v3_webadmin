'use client';

import { DatePicker, Input, InputNumber, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { DATE_PRESETS, VALUE_OPTIONAL_OPERATORS, type FilterCondition, type FilterField } from './types';

type Props = {
  field?: FilterField;
  condition: FilterCondition;
  onChange: (value: any, kind: 'text' | 'number' | 'id' | 'select' | 'date') => void;
  getPopupContainer?: (trigger?: HTMLElement) => HTMLElement;
};

const defaultPopupContainer = (trigger?: HTMLElement) => (trigger?.closest('.ant-popover') as HTMLElement) || document.body;

function toDayjs(value: any): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

export function ValueInput({ field, condition, onChange, getPopupContainer = defaultPopupContainer }: Props) {
  if (!field || !condition.operator || VALUE_OPTIONAL_OPERATORS.includes(condition.operator as any)) {
    return null;
  }

  const value = condition.value;
  const isMulti = condition.operator === 'in' || condition.operator === 'not_in';
  const isBetween = condition.operator === 'between';

  if (field.type === 'select' || field.type === 'multiselect') {
    return (
      <Select
        mode={isMulti ? 'multiple' : undefined}
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="Value"
        style={{ minWidth: 160 }}
        value={value ?? (isMulti ? [] : undefined)}
        options={(field.options || []).map((option) => ({ label: option.label, value: option.value }))}
        getPopupContainer={getPopupContainer}
        onChange={(next) => onChange(next, 'select')}
      />
    );
  }

  if (field.type === 'boolean') return null;

  if (field.type === 'id') {
    if (isMulti) {
      return (
        <Select
          mode="tags"
          placeholder="Paste IDs"
          style={{ minWidth: 200 }}
          value={Array.isArray(value) ? value : []}
          getPopupContainer={getPopupContainer}
          onChange={(next) => onChange(next, 'id')}
        />
      );
    }
    return (
      <Input
        placeholder="24-character ID"
        value={value || ''}
        onChange={(event) => onChange(event.target.value, 'id')}
        style={{ minWidth: 180 }}
      />
    );
  }

  if (field.type === 'number') {
    if (isBetween) {
      const from = Array.isArray(value) ? value[0] : value?.from;
      const to = Array.isArray(value) ? value[1] : value?.to;
      return (
        <Space>
          <InputNumber placeholder="From" value={from} onChange={(next) => onChange([next, to], 'number')} />
          <InputNumber placeholder="To" value={to} onChange={(next) => onChange([from, next], 'number')} />
        </Space>
      );
    }
    return (
      <InputNumber
        placeholder="Value"
        value={typeof value === 'number' ? value : value || undefined}
        onChange={(next) => onChange(next, 'number')}
        style={{ minWidth: 120 }}
      />
    );
  }

  if (field.type === 'date') {
    if (isBetween) {
      const from = Array.isArray(value) ? value[0] : value?.from;
      const to = Array.isArray(value) ? value[1] : value?.to;
      return (
        <Space wrap>
          <DatePicker
            value={toDayjs(from)}
            getPopupContainer={getPopupContainer}
            onChange={(next) => onChange([next ? next.toISOString() : null, to], 'date')}
          />
          <DatePicker
            value={toDayjs(to)}
            getPopupContainer={getPopupContainer}
            onChange={(next) => onChange([from, next ? next.toISOString() : null], 'date')}
          />
        </Space>
      );
    }
    const preset = DATE_PRESETS.find((item) => item.value === value);
    return (
      <Space wrap>
        <Select
          allowClear
          placeholder="Preset"
          style={{ minWidth: 140 }}
          value={preset ? value : undefined}
          options={DATE_PRESETS}
          getPopupContainer={getPopupContainer}
          onChange={(next) => onChange(next, 'date')}
        />
        <DatePicker
          value={preset ? null : toDayjs(value)}
          getPopupContainer={getPopupContainer}
          onChange={(next) => onChange(next ? next.toISOString() : null, 'date')}
        />
      </Space>
    );
  }

  if (isMulti) {
    return (
      <Select
        mode="tags"
        placeholder="Values"
        style={{ minWidth: 180 }}
        value={Array.isArray(value) ? value : []}
        getPopupContainer={getPopupContainer}
        onChange={(next) => onChange(next, 'select')}
      />
    );
  }

  return (
    <Input
      placeholder="Value"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value, 'text')}
      style={{ minWidth: 160 }}
    />
  );
}
