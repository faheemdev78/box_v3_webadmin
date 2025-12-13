import React, { useState } from 'react';
import { Space, Button, Tag, Dropdown, Input, Popover } from 'antd';
import { FilterOutlined, CloseOutlined, DownOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { FilterCondition, FieldDefinition } from '../types';

interface QuickFiltersBarProps {
  filters: FilterCondition[]; // Active filters from the view
  fields: FieldDefinition[]; // Field definitions to get labels
  onFilterChange?: (filterId: string, newValue: any) => void; // When a changeable filter is modified
  onRemoveFilter?: (filterId: string) => void; // When a filter is removed
  onClearAll?: () => void; // Clear all filters
  onAdvancedFiltersClick?: () => void; // Open advanced filters modal
  onRefresh?: () => void; // Refresh data
}

export const QuickFiltersBar: React.FC<QuickFiltersBarProps> = ({
  filters,
  fields,
  onFilterChange,
  onRemoveFilter,
  onClearAll,
  onAdvancedFiltersClick,
  onRefresh
}) => {
  // Get field definition for a filter
  const getFieldDef = (fieldKey: string): FieldDefinition | undefined => {
    return fields.find(f => f.key === fieldKey);
  };

  // Get display label for a field
  const getFieldLabel = (fieldKey: string): string => {
    const field = getFieldDef(fieldKey);
    return field?.label || fieldKey;
  };

  // Get display value for a filter
  const getFilterValueDisplay = (filter: FilterCondition): string => {
    const field = getFieldDef(filter.field);

    // Handle array values (e.g., for 'in' operator)
    if (Array.isArray(filter.value)) {
      // Try to map to option labels if field has options
      if (field?.options) {
        const labels = filter.value.map(val => {
          const option = field.options?.find(opt => opt.value === val);
          return option?.label || String(val);
        });
        return labels.join(', ');
      }
      return filter.value.join(', ');
    }

    // Handle single values
    if (field?.options) {
      const option = field.options.find(opt => opt.value === filter.value);
      return option?.label || String(filter.value);
    }

    return String(filter.value);
  };

  // Component for text/number filter input
  const TextFilterInput: React.FC<{ filter: FilterCondition; field: FieldDefinition }> = ({ filter, field }) => {
    const [inputValue, setInputValue] = useState(filter.value || '');
    const [popoverVisible, setPopoverVisible] = useState(false);

    const handleChange = (value: any) => {
      if (onFilterChange) {
        onFilterChange(filter.id, value);
      }
    };

    const displayText = filter.value
      ? `${getFieldLabel(filter.field)}: ${filter.value}`
      : getFieldLabel(filter.field);

    const handleApply = () => {
      handleChange(inputValue);
      setPopoverVisible(false);
    };

    const content = (
      <div style={{ width: 250 }}>
        <Input
          placeholder={`Enter ${getFieldLabel(filter.field).toLowerCase()}`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleApply}
          autoFocus
          suffix={
            <Button type="link" size="small" onClick={handleApply}>
              Apply
            </Button>
          }
        />
      </div>
    );

    return (
      <Popover
        content={content}
        trigger="click"
        open={popoverVisible}
        onOpenChange={setPopoverVisible}
      >
        <Button>
          <Space size={4}>
            {displayText}
            {onRemoveFilter && (
              <CloseOutlined
                style={{ fontSize: 12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFilter(filter.id);
                }}
              />
            )}
            <SearchOutlined style={{ fontSize: 10 }} />
          </Space>
        </Button>
      </Popover>
    );
  };

  // Render a changeable filter (with appropriate input control)
  const renderChangeableFilter = (filter: FilterCondition) => {
    const field = getFieldDef(filter.field);

    if (!field) {
      return renderStaticFilter(filter);
    }

    const handleChange = (value: any) => {
      if (onFilterChange) {
        onFilterChange(filter.id, value);
      }
    };

    // For select/multiselect with options - show as dropdown
    if (field.options && field.options.length > 0) {
      const currentValue = Array.isArray(filter.value) ? filter.value : [filter.value];
      const filterCount = currentValue.filter(v => v != null).length;
      const displayText = filterCount > 0
        ? `${getFieldLabel(filter.field)}: ${getFilterValueDisplay(filter)}`
        : getFieldLabel(filter.field);

      return (
        <Dropdown
          key={filter.id}
          trigger={['click']}
          menu={{
            items: field.options.map(opt => ({
              key: opt.value,
              label: opt.label
            })),
            selectable: true,
            multiple: true,
            selectedKeys: currentValue,
            onSelect: ({ key }) => {
              const newValue = [...currentValue, key];
              handleChange(newValue);
            },
            onDeselect: ({ key }) => {
              const newValue = currentValue.filter(v => v !== key);
              handleChange(newValue.length > 0 ? newValue : null);
            }
          }}
        >
          <Button>
            <Space size={4}>
              {displayText}
              {onRemoveFilter && (
                <CloseOutlined
                  style={{ fontSize: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFilter(filter.id);
                  }}
                />
              )}
              <DownOutlined style={{ fontSize: 10 }} />
            </Space>
          </Button>
        </Dropdown>
      );
    }

    // For text/number fields - use the TextFilterInput component
    if (field.type === 'text' || field.type === 'number') {
      return <TextFilterInput key={filter.id} filter={filter} field={field} />;
    }

    // For other changeable filters, show as tag for now
    return (
      <Tag
        key={filter.id}
        closable={!!onRemoveFilter}
        onClose={() => onRemoveFilter && onRemoveFilter(filter.id)}
      >
        {getFieldLabel(filter.field)}: {getFilterValueDisplay(filter)}
      </Tag>
    );
  };

  // Render a static filter (read-only tag)
  const renderStaticFilter = (filter: FilterCondition) => {
    return (
      <Tag
        key={filter.id}
        closable={!!onRemoveFilter}
        onClose={() => onRemoveFilter && onRemoveFilter(filter.id)}
      >
        {getFieldLabel(filter.field)}: {getFilterValueDisplay(filter)}
      </Tag>
    );
  };

  // Render filter based on whether it's changeable or not
  const renderFilter = (filter: FilterCondition) => {
    if (filter.isChangeable) {
      return renderChangeableFilter(filter);
    }
    return renderStaticFilter(filter);
  };

  // Don't render if no filters
  if (!filters || filters.length === 0) {
    return (<div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
      <Space>
        <Button icon={<FilterOutlined />} onClick={onAdvancedFiltersClick}>Advanced filters</Button>
        {onRefresh && (<Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button>)}
      </Space>
    </div>);
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
      <Space size="middle" wrap>
        {/* Render all filters */}
        {filters.map(renderFilter)}

        {/* Clear all button */}
        {filters.length > 0 && onClearAll && (
          <Button type="text" onClick={onClearAll}>Clear all</Button>
        )}

        {/* Advanced filters button */}
        <Button icon={<FilterOutlined />} onClick={onAdvancedFiltersClick}>Advanced filters</Button>

        {/* Refresh button */}
        {onRefresh && (
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button>
        )}
      </Space>
    </div>
  );
};