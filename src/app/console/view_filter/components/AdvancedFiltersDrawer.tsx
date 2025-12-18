import React, { useState } from 'react';
import { Drawer, Button, Card, Space, Input, Select, Divider, message, Tag } from 'antd';
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { FilterCondition, FieldDefinition, FilterOperator } from '../types';

interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

interface AdvancedFiltersDrawerProps {
  visible: boolean;
  onClose: () => void;
  filterGroups: FilterGroup[];
  fields: FieldDefinition[];
  onApply: (filterGroups: FilterGroup[]) => void;
}

// Operator labels mapping
const OPERATOR_LABELS: Record<FilterOperator, { label: string; description: string }> = {
  'equals': { label: 'is equal to', description: 'Exact match' },
  'not_equals': { label: 'is not equal to', description: 'Does not match' },
  'contains': { label: 'contains', description: 'Contains text' },
  'not_contains': { label: 'doesn\'t contain', description: 'Does not contain text' },
  'starts_with': { label: 'starts with', description: 'Begins with' },
  'ends_with': { label: 'ends with', description: 'Ends with' },
  'greater_than': { label: 'is greater than', description: 'Numeric comparison' },
  'less_than': { label: 'is less than', description: 'Numeric comparison' },
  'greater_or_equal': { label: 'is greater than or equal to', description: 'Numeric comparison' },
  'less_or_equal': { label: 'is less than or equal to', description: 'Numeric comparison' },
  'in': { label: 'is any of', description: 'Matches any of the values' },
  'not_in': { label: 'is none of', description: 'Does not match any values' },
  'is_empty': { label: 'is unknown', description: 'Has no value' },
  'is_not_empty': { label: 'is known', description: 'Has any value' },
  'is_true': { label: 'is true', description: 'Boolean true' },
  'is_false': { label: 'is false', description: 'Boolean false' }
};

// Date/time preset options
const DATE_PRESETS = [
  { label: 'Today', value: 'today', description: 'All of today' },
  { label: 'Yesterday', value: 'yesterday', description: 'The previous 24 hour day' },
  { label: 'Tomorrow', value: 'tomorrow', description: 'The next 24 hour day' },
  { label: 'This week', value: 'this_week', description: 'Current week' },
  { label: 'Last 7 days', value: 'last_7_days', description: 'Previous 7 days' },
  { label: 'Last 30 days', value: 'last_30_days', description: 'Previous 30 days' },
  { label: 'This month', value: 'this_month', description: 'Current month' },
  { label: 'Last month', value: 'last_month', description: 'Previous month' }
];

export const AdvancedFiltersDrawer: React.FC<AdvancedFiltersDrawerProps> = ({
  visible,
  onClose,
  filterGroups: initialFilterGroups,
  fields,
  onApply
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(initialFilterGroups);
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when drawer opens
  React.useEffect(() => {
    if (visible) {
      setFilterGroups(initialFilterGroups);
      setIsEditMode(initialFilterGroups.length === 0);
      setEditingFilterId(null);
      setSearchTerm('');
    }
  }, [visible, initialFilterGroups]);

  // Get field definition
  const getField = (key: string) => fields.find(f => f.key === key);

  // Get operator label
  const getOperatorLabel = (operator: FilterOperator) => {
    return OPERATOR_LABELS[operator]?.label || operator;
  };

  // Format filter value for display
  const formatFilterValue = (filter: FilterCondition) => {
    const field = getField(filter.field);

    if (Array.isArray(filter.value)) {
      if (field?.options) {
        return filter.value.map(v =>
          field.options?.find(opt => opt.value === v)?.label || v
        ).join(' or ');
      }
      return filter.value.join(' or ');
    }

    if (field?.options) {
      return field.options.find(opt => opt.value === filter.value)?.label || filter.value;
    }

    return String(filter.value);
  };

  // Generate filter summary text
  const getFilterSummary = (filter: FilterCondition) => {
    const field = getField(filter.field);
    const operatorLabel = getOperatorLabel(filter.operator);
    const value = formatFilterValue(filter);

    return <>{`${field?.label || filter.field} ${operatorLabel}`} <Tag color="orange">{value}</Tag></>;
  };

  // Add new filter to a group
  const handleAddFilter = (groupId: string) => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      field: fields[0]?.key || '',
      operator: 'equals',
      value: null,
      isChangeable: true // All filters added via advanced drawer are changeable by default
    };

    setFilterGroups(filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, newFilter]
        };
      }
      return group;
    }));

    setEditingFilterId(newFilter.id);
  };

  // Add new filter group
  const handleAddFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}`,
      logic: 'OR',
      conditions: []
    };

    setFilterGroups([...filterGroups, newGroup]);
  };

  // Update filter
  const handleUpdateFilter = (groupId: string, filterId: string, updates: Partial<FilterCondition>) => {
    setFilterGroups(filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map(condition =>
            condition.id === filterId ? { ...condition, ...updates } : condition
          )
        };
      }
      return group;
    }));
  };

  // Delete filter
  const handleDeleteFilter = (groupId: string, filterId: string) => {
    setFilterGroups(filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter(c => c.id !== filterId)
        };
      }
      return group;
    }).filter(group => group.conditions.length > 0)); // Remove empty groups
  };

  // Duplicate filter group
  const handleDuplicateGroup = (groupId: string) => {
    const group = filterGroups.find(g => g.id === groupId);
    if (group) {
      const newGroup: FilterGroup = {
        id: `group_${Date.now()}`,
        logic: group.logic,
        conditions: group.conditions.map(c => ({
          ...c,
          id: `filter_${Date.now()}_${Math.random()}`
        }))
      };
      setFilterGroups([...filterGroups, newGroup]);
    }
  };

  // Delete filter group
  const handleDeleteGroup = (groupId: string) => setFilterGroups(filterGroups.filter(g => g.id !== groupId));

  // Apply filters
  const handleApply = () => {
    onApply(filterGroups);
    message.success('Filters applied');
    onClose();
  };

  // Get available operators for a field
  const getAvailableOperators = (fieldKey: string): FilterOperator[] => {
    const field = getField(fieldKey);
    return field?.operators || ['equals'];
  };

  // Get value input for a filter
  const renderValueInput = (filter: FilterCondition, groupId: string) => {
    console.log("renderValueInput() => filter.field: ", filter.field)
    console.log("fields: ", fields)
    const field = getField(filter.field);

    // For operators that don't need a value
    if (['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(filter.operator)) return null;

    // For date fields, show date presets
    if (field?.type === 'date') {
      return (
        <Select
          style={{ width: '100%' }}
          value={filter.value}
          onChange={(value) => handleUpdateFilter(groupId, filter.id, { value })}
          placeholder="Select date"
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={DATE_PRESETS.map(preset => ({
            label: preset.label,
            value: preset.value,
            title: preset.description
          }))}
        />
      );
    }

    // For select fields with options
    if (field?.options) {
      const isMultiple = filter.operator === 'in' || filter.operator === 'not_in';

      return (
        <Select
          mode={isMultiple ? 'multiple' : undefined}
          style={{ width: '100%' }}
          value={filter.value}
          onChange={(value) => handleUpdateFilter(groupId, filter.id, { value })}
          placeholder={`Select ${field.label.toLowerCase()}`}
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={field.options}
        />
      );
    }

    // For number fields
    if (field?.type === 'number') {
      return (
        <Input
          type="number"
          value={filter.value}
          onChange={(e) => handleUpdateFilter(groupId, filter.id, { value: Number(e.target.value) })}
          placeholder="Enter number"
        />
      );
    }

    // Default text input
    return (
      <Input
        value={filter.value}
        onChange={(e) => handleUpdateFilter(groupId, filter.id, { value: e.target.value })}
        placeholder="Enter value"
      />
    );
  };

  // Filter fields by search term
  const filteredFields = fields.filter(field =>
    field.isFilterable !== false &&
    (field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
     field.key.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group filtered fields
  const groupedFields = filteredFields.reduce((acc, field) => {
    const group = field.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FieldDefinition[]>);

  const editingFilter = filterGroups.flatMap(g => g.conditions).find(f => f.id === editingFilterId);
  const editingGroup = filterGroups.find(g => g.conditions.some(c => c.id === editingFilterId));

  return (
    <Drawer title="All Filters" open={visible} onClose={onClose} width={720} footer={null}>
      <div style={{ display: 'flex', height: '100%', marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: -24 }}>
        {/* Left Panel - Filter Groups */}
        <div style={{ flex: 1, padding: 24, borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0 }}>Quick filters</h4>
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>These filters were set within the current table.</p>
            </div>
            {filterGroups.length > 0 && (<Button type="link" size="small">Hide</Button>)}
          </div>

          {filterGroups.length > 0 && (<>
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontWeight: 'bold' }}>AND</div>

            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Advanced Filters</h4>
              {!isEditMode && (
                <Button size="small" onClick={() => setIsEditMode(true)}>Edit filters</Button>
              )}
              {isEditMode && (
                <Button size="small" onClick={() => { setIsEditMode(false); setEditingFilterId(null); }}>Cancel</Button>
              )}
            </div>
          </>)}

          {/* View Mode */}
          {!isEditMode && filterGroups.length > 0 && (<>
              {filterGroups.map((group, groupIndex) => (
                <div key={group.id}>
                  <Card size="small" style={{ marginBottom: 8, backgroundColor: '#fafafa' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Group {groupIndex + 1}</div>
                    {group.conditions.map((filter, idx) => (
                      <div key={filter.id} style={{ fontSize: 13, marginBottom: idx < group.conditions.length - 1 ? 4 : 0 }}>
                        {getFilterSummary(filter)}
                      </div>
                    ))}
                  </Card>
                  {groupIndex < filterGroups.length - 1 && (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#999', fontWeight: 'bold' }}>{group.logic}</div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Edit Mode */}
          {isEditMode && (<>
            {filterGroups.map((group, groupIndex) => (
              <div key={group.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>Group {groupIndex + 1}</strong>
                  <Space>
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleDuplicateGroup(group.id)} />
                    <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteGroup(group.id)} />
                  </Space>
                </div>

                {group.conditions.map((filter, filterIndex) => (
                  <div key={filter.id}>
                    <Card
                      size="small"
                      style={{
                        marginBottom: 8,
                        cursor: 'pointer',
                        border: editingFilterId === filter.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                      }}
                      onClick={() => setEditingFilterId(filter.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13 }}>{getFilterSummary(filter)}</span>
                        <Button type="text" size="small" icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFilter(group.id, filter.id);
                            if (editingFilterId === filter.id) setEditingFilterId(null);
                          }}
                        />
                      </div>
                    </Card>
                    {filterIndex < group.conditions.length - 1 && (
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>and</div>
                    )}
                  </div>
                ))}

                <Button size="small" icon={<span>+</span>} onClick={() => handleAddFilter(group.id)} style={{ marginTop: 4 }}>Add filter</Button>

                {groupIndex < filterGroups.length - 1 && (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: '#999', fontWeight: 'bold' }}>{group.logic}</div>
                )}
              </div>
            ))}

            {filterGroups.length > 0 && (
              <Button icon={<span>+</span>} onClick={handleAddFilterGroup} style={{ marginTop: 8 }}>Add filter group</Button>
            )}

            {filterGroups.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <p>This view doesn&apos;t have any advanced filters.</p>
                <Button type="primary" onClick={handleAddFilterGroup}>Create filter group</Button>
              </div>
            )}
          </>)}

          <Divider />

          <Button type="primary" onClick={handleApply} block>Apply filters</Button>
        </div>

        {/* Right Panel - Add/Edit Filter or Field List */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {editingFilter && editingGroup ? (<>
            <h4>Edit filter</h4>
            <Card size="small">
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{getField(editingFilter.field)?.label || editingFilter.field}</strong>
                  <Space>
                    <Button type="text" size="small" icon={<CopyOutlined />} title="Duplicate"/>
                    <Button type="text" size="small" icon={<DeleteOutlined />}
                      onClick={() => {
                        handleDeleteFilter(editingGroup.id, editingFilter.id);
                        setEditingFilterId(null);
                      }}
                    />
                  </Space>
                </div>

                <Select
                  style={{ width: '100%' }}
                  value={editingFilter.operator}
                  onChange={(operator) => handleUpdateFilter(editingGroup.id, editingFilter.id, { operator })}
                  showSearch
                  placeholder="Select operator"
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  options={getAvailableOperators(editingFilter.field).map(op => ({
                    label: getOperatorLabel(op),
                    value: op
                  }))}
                />

                {renderValueInput(editingFilter, editingGroup.id)}
              </Space>
            </Card>
          </>) : 
          isEditMode && filterGroups.some(g => g.conditions.length > 0) ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Select a filter to start editing</div>
          ) : 
          (<>
            <h4>Add filter</h4>
            <Input.Search
              placeholder="Search in properties"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
              allowClear
            />

            <div>
              {Object.entries(groupedFields).map(([groupName, groupFields]) => (
                <div key={groupName} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>{groupName}</div>
                  {groupFields.map(field => (
                    <div key={field.key}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 13 }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => {
                        // Add to first group or create new group
                        if (filterGroups.length === 0) handleAddFilterGroup();
                        const targetGroup = filterGroups[0] || { id: `group_${Date.now()}`, logic: 'AND' as const, conditions: [] };
                        const newFilter: FilterCondition = {
                          id: `filter_${Date.now()}`,
                          field: field.key,
                          operator: field.operators[0],
                          value: null,
                          isChangeable: true // All filters added via advanced drawer are changeable by default
                        };

                        if (filterGroups.length === 0) {
                          setFilterGroups([{ ...targetGroup, conditions: [newFilter] }]);
                        } else {
                          setFilterGroups(filterGroups.map((g, idx) =>
                            idx === 0 ? { ...g, conditions: [...g.conditions, newFilter] } : g
                          ));
                        }
                        setIsEditMode(true);
                        setEditingFilterId(newFilter.id);
                      }}
                    >
                      {field.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>

          </>)}
        </div>
      </div>
    </Drawer>
  );
};