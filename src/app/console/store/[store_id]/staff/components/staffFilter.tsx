'use client'

import React, { useState, useRef } from 'react'
import { Card, Button, Row, Col, Space, Tag, Divider, Tabs, Modal, message } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    FilterOutlined,
    SaveOutlined,
    CloseOutlined,
    StarOutlined,
    StarFilled
} from '@ant-design/icons';
import { Form as FinalForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays';
import { FormField, submitHandler } from '@_/components/form';
import { IconButton } from '@_/components';

// Define filter field types and their operators
interface FilterField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'daterange' | 'boolean';
    operators: FilterOperator[];
    options?: { label: string; value: string }[];
}

interface FilterOperator {
    value: string;
    label: string;
}

interface FilterCondition {
    field: string;
    operator: string;
    value: any;
}

interface FilterGroup {
    logic: 'AND' | 'OR';
    conditions: FilterCondition[];
}

interface SavedFilter {
    id: string;
    name: string;
    description?: string;
    filterGroups: FilterGroup[];
    isFavorite: boolean;
    createdAt: string;
}

// Staff filter fields configuration
const STAFF_FILTER_FIELDS: FilterField[] = [
    {
        key: 'name',
        label: 'Name',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'starts_with', label: 'Starts with' },
            { value: 'ends_with', label: 'Ends with' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'email',
        label: 'Email',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'phone',
        label: 'Phone',
        type: 'text',
        operators: [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' },
            { value: 'not_in', label: 'Is none of' }
        ],
        options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'On Leave', value: 'on_leave' },
            { label: 'Suspended', value: 'suspended' }
        ]
    },
    {
        key: 'department',
        label: 'Department',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' },
            { value: 'not_in', label: 'Is none of' }
        ],
        options: [
            { label: 'Operations', value: 'operations' },
            { label: 'Sales', value: 'sales' },
            { label: 'Customer Service', value: 'customer_service' },
            { label: 'Warehouse', value: 'warehouse' },
            { label: 'Delivery', value: 'delivery' },
            { label: 'Management', value: 'management' }
        ]
    },
    {
        key: 'position',
        label: 'Position',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
            { value: 'in', label: 'Is any of' }
        ],
        options: [
            { label: 'Store Manager', value: 'store_manager' },
            { label: 'Assistant Manager', value: 'assistant_manager' },
            { label: 'Sales Associate', value: 'sales_associate' },
            { label: 'Cashier', value: 'cashier' },
            { label: 'Warehouse Staff', value: 'warehouse_staff' },
            { label: 'Delivery Driver', value: 'delivery_driver' }
        ]
    },
    {
        key: 'acc_type',
        label: 'Account Type',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' }
        ],
        options: [
            { label: 'Staff', value: 'staff' },
            { label: 'Admin', value: 'admin' },
            { label: 'Manager', value: 'manager' }
        ]
    },
    {
        key: 'acc_group',
        label: 'Account Group',
        type: 'select',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' }
        ],
        options: [
            { label: 'Manager', value: 'manager' },
            { label: 'Staff', value: 'staff' },
            { label: 'Part-time', value: 'part_time' }
        ]
    },
    {
        key: 'hourly_rate',
        label: 'Hourly Rate',
        type: 'number',
        operators: [
            { value: 'equals', label: 'Equals' },
            { value: 'not_equals', label: 'Not equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ]
    },
    {
        key: 'join_date',
        label: 'Join Date',
        type: 'date',
        operators: [
            { value: 'equals', label: 'Is' },
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
            { value: 'between', label: 'Between' },
            { value: 'last_7_days', label: 'Last 7 days' },
            { value: 'last_30_days', label: 'Last 30 days' },
            { value: 'this_month', label: 'This month' },
            { value: 'last_month', label: 'Last month' }
        ]
    },
    {
        key: 'performance_rating',
        label: 'Performance Rating',
        type: 'number',
        operators: [
            { value: 'equals', label: 'Equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' }
        ]
    },
    {
        key: 'attendance_rate',
        label: 'Attendance Rate (%)',
        type: 'number',
        operators: [
            { value: 'equals', label: 'Equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' }
        ]
    }
];

// Dummy saved filters for demo
const INITIAL_SAVED_FILTERS: SavedFilter[] = [
    {
        id: 'filter_1',
        name: 'Active Store Managers',
        description: 'All active staff with store manager position',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'status', operator: 'equals', value: 'active' },
                    { field: 'position', operator: 'equals', value: 'store_manager' }
                ]
            }
        ],
        isFavorite: true,
        createdAt: '2024-01-15T10:00:00Z'
    },
    {
        id: 'filter_2',
        name: 'High Performers',
        description: 'Staff with rating > 4.0 and attendance > 90%',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'performance_rating', operator: 'greater_than', value: 4.0 },
                    { field: 'attendance_rate', operator: 'greater_than', value: 90 }
                ]
            }
        ],
        isFavorite: true,
        createdAt: '2024-01-10T14:30:00Z'
    },
    {
        id: 'filter_3',
        name: 'Recent Hires',
        description: 'Staff who joined in the last 30 days',
        filterGroups: [
            {
                logic: 'AND',
                conditions: [
                    { field: 'join_date', operator: 'last_30_days', value: null }
                ]
            }
        ],
        isFavorite: false,
        createdAt: '2024-01-05T09:00:00Z'
    }
];

export function StaffFilter({ onFilterChange }: { onFilterChange?: (filterGroups: FilterGroup[]) => void }) {
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(INITIAL_SAVED_FILTERS);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [activeTab, setActiveTab] = useState('builder');
    const currentFormRef = useRef<any>(null);

    const initialValues = {
        filterGroups: [
            {
                logic: 'AND',
                conditions: []
            }
        ]
    };

    // Get field configuration
    const getFieldConfig = (fieldKey: string): FilterField | undefined => {
        return STAFF_FILTER_FIELDS.find(f => f.key === fieldKey);
    };

    // Apply filters
    const handleApplyFilters = (values: any) => {
        console.log('Applying filters:', values);
        if (onFilterChange) {
            onFilterChange(values.filterGroups);
        }
        message.success('Filters applied successfully');
    };

    // Save current filter
    const handleSaveFilter = (values: any) => {
        if (!values.filterName?.trim()) {
            message.error('Please enter a filter name');
            return;
        }

        // Get current filter data from the form ref
        const currentFilterGroups = currentFormRef.current?.getState()?.values?.filterGroups || [];

        const newFilter: SavedFilter = {
            id: 'filter_' + Date.now(),
            name: values.filterName,
            description: values.filterDescription,
            filterGroups: JSON.parse(JSON.stringify(currentFilterGroups)),
            isFavorite: false,
            createdAt: new Date().toISOString()
        };

        setSavedFilters([newFilter, ...savedFilters]);
        setShowSaveModal(false);
        message.success(`Filter "${values.filterName}" saved successfully`);
    };

    // Load a saved filter
    const loadFilter = (filter: SavedFilter, form: any) => {
        form.change('filterGroups', JSON.parse(JSON.stringify(filter.filterGroups)));
        setActiveTab('builder');
        message.success(`Filter "${filter.name}" loaded`);
    };

    // Delete a saved filter
    const deleteFilter = (filterId: string) => {
        setSavedFilters(savedFilters.filter(f => f.id !== filterId));
        message.success('Filter deleted');
    };

    // Toggle favorite
    const toggleFavorite = (filterId: string) => {
        setSavedFilters(savedFilters.map(f =>
            f.id === filterId ? { ...f, isFavorite: !f.isFavorite } : f
        ));
    };

    // Render value input based on field type and operator
    const renderValueInput = (conditionName: string, fieldKey: string, operator: string) => {
        const fieldConfig = getFieldConfig(fieldKey);
        if (!fieldConfig) return null;

        // Operators that don't need value input
        const noValueOperators = ['is_empty', 'is_not_empty', 'last_7_days', 'last_30_days', 'this_month', 'last_month'];
        if (noValueOperators.includes(operator)) {
            return <FormField name={`${conditionName}.value`} type="text" placeholder="No value needed" disabled style={{ width: 200 }} />;
        }

        switch (fieldConfig.type) {
            case 'text':
                return <FormField name={`${conditionName}.value`} type="text" placeholder="Enter value" style={{ width: 200 }} />;

            case 'number':
                if (operator === 'between') {
                    return (
                        <Space>
                            <FormField name={`${conditionName}.value.min`} type="number" placeholder="Min" style={{ width: 95 }} />
                            <span>to</span>
                            <FormField name={`${conditionName}.value.max`} type="number" placeholder="Max" style={{ width: 95 }} />
                        </Space>
                    );
                }
                return <FormField name={`${conditionName}.value`} type="number" placeholder="Enter value" style={{ width: 200 }} />;

            case 'select':
                const mode = ['in', 'not_in'].includes(operator) ? 'multiple' : undefined;
                return (
                    <FormField
                        name={`${conditionName}.value`}
                        type="select"
                        placeholder="Select value"
                        options={fieldConfig.options}
                        mode={mode}
                        style={{ width: 200 }}
                    />
                );

            case 'date':
                if (operator === 'between') {
                    return <FormField name={`${conditionName}.value`} type="date-range" style={{ width: 260 }} />;
                }
                return <FormField name={`${conditionName}.value`} type="date" style={{ width: 200 }} />;

            default:
                return null;
        }
    };

    // Render saved filters tab
    const renderSavedFilters = (form: any) => {
        const favoriteFilters = savedFilters.filter(f => f.isFavorite);
        const otherFilters = savedFilters.filter(f => !f.isFavorite);

        return (<div>
            {favoriteFilters.length > 0 && (<>
                <h4>Favorite Filters</h4>
                <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                    {favoriteFilters.map(filter => (
                        <Card key={filter.id} size="small" style={{ width: '100%' }}>
                            <Row justify="space-between" align="middle">
                                <Col flex="auto">
                                    <Space direction="vertical" size={0}>
                                        <Space>
                                            <StarFilled style={{ color: '#faad14' }} />
                                            <strong>{filter.name}</strong>
                                        </Space>
                                        {filter.description && (
                                            <div style={{ fontSize: 12, color: '#666' }}>{filter.description}</div>
                                        )}
                                    </Space>
                                </Col>
                                <Col>
                                    <Space>
                                        <Button size="small" onClick={() => loadFilter(filter, form)}>Load</Button>
                                        <Button
                                            size="small"
                                            icon={<StarFilled />}
                                            onClick={() => toggleFavorite(filter.id)}
                                        />
                                        <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => deleteFilter(filter.id)}
                                        />
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    ))}
                </Space>
            </>)}

            {otherFilters.length > 0 && (
                <>
                    <h4>All Filters</h4>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {otherFilters.map(filter => (
                            <Card key={filter.id} size="small" style={{ width: '100%' }}>
                                <Row justify="space-between" align="middle">
                                    <Col flex="auto">
                                        <Space direction="vertical" size={0}>
                                            <strong>{filter.name}</strong>
                                            {filter.description && (
                                                <div style={{ fontSize: 12, color: '#666' }}>{filter.description}</div>
                                            )}
                                        </Space>
                                    </Col>
                                    <Col>
                                        <Space>
                                            <Button size="small" onClick={() => loadFilter(filter, form)}>Load</Button>
                                            <Button
                                                size="small"
                                                icon={<StarOutlined />}
                                                onClick={() => toggleFavorite(filter.id)}
                                            />
                                            <Button
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => deleteFilter(filter.id)}
                                            />
                                        </Space>
                                    </Col>
                                </Row>
                            </Card>
                        ))}
                    </Space>
                </>
            )}

            {savedFilters.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    No saved filters yet. Create filters in the Builder tab and save them.
                </div>
            )}
        </div>);
    };

    return (
        <FinalForm
            onSubmit={handleApplyFilters}
            initialValues={initialValues}
            mutators={{ ...arrayMutators }}
            render={(formArgs) => {
                const { handleSubmit, form } = formArgs;

                // Store form reference for saving filters
                currentFormRef.current = form;

                return (
                    <Card
                        title={<Space><FilterOutlined /> Staff Filters</Space>}
                        extra={<Space>
                            <Button icon={<SaveOutlined />} onClick={() => setShowSaveModal(true)}>Save Filter</Button>
                            <Button onClick={() => form.reset()}>Clear All</Button>
                            <Button type="primary" onClick={handleSubmit}>Apply Filters</Button>
                        </Space>}
                    >
                        <form {...submitHandler(formArgs)}>
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                tabBarExtraContent={
                                    <Space>
                                        <Button
                                            type="link"
                                            icon={<PlusOutlined />}
                                            onClick={() => {
                                                setActiveTab('builder');
                                                form.reset();
                                            }}
                                        >
                                            Add Filter
                                        </Button>
                                        <Button
                                            type="link"
                                            onClick={() => setActiveTab('all-filters')}
                                        >
                                            All Filters
                                        </Button>
                                    </Space>
                                }
                                items={[
                                    {
                                        key: 'builder',
                                        label: 'Filter Builder',
                                        children: (<div>
                                            <FieldArray name="filterGroups">
                                                {({ fields: groupFields }) => (<>
                                                    {groupFields.map((groupName, groupIndex) => {
                                                        const group = groupFields.value[groupIndex];

                                                        return (
                                                            <div key={groupName}>
                                                                {groupIndex > 0 && (<Divider style={{ margin: '16px 0' }}><Tag color="blue">OR</Tag></Divider>)}

                                                                <Card
                                                                    size="small"
                                                                    style={{ marginBottom: 16 }}
                                                                    title={
                                                                        <Space>
                                                                            <span>Filter Group {groupIndex + 1}</span>
                                                                            <Button size="small"
                                                                                onClick={() => {
                                                                                    const newLogic = group.logic === 'AND' ? 'OR' : 'AND';
                                                                                    form.change(`${groupName}.logic`, newLogic);
                                                                                }}
                                                                            >
                                                                                {group.logic || 'AND'}
                                                                            </Button>
                                                                        </Space>
                                                                    }
                                                                    extra={groupFields.length > 1 && (
                                                                            <Button size="small" danger icon={<CloseOutlined />} 
                                                                            onClick={() => groupFields.remove(groupIndex)}>Remove Group</Button>
                                                                        )
                                                                    }
                                                                >
                                                                    <FieldArray name={`${groupName}.conditions`}>
                                                                        {({ fields: conditionFields }) => (<Space direction="vertical" style={{ width: '100%' }}>
                                                                            {conditionFields.map((conditionName, condIndex) => {
                                                                                const condition = conditionFields.value[condIndex];
                                                                                const fieldConfig = getFieldConfig(condition?.field);

                                                                                return (<div key={conditionName}>
                                                                                    {condIndex > 0 && (<Tag color={group.logic === 'AND' ? 'green' : 'orange'} style={{ marginBottom: 8 }}>{group.logic || 'AND'}</Tag>)}
                                                                                    <Row gutter={8} align="middle">
                                                                                        <Col>
                                                                                            <FormField
                                                                                                name={`${conditionName}.field`}
                                                                                                type="select"
                                                                                                placeholder="Select field"
                                                                                                options={STAFF_FILTER_FIELDS.map(f => ({
                                                                                                    label: f.label,
                                                                                                    value: f.key
                                                                                                }))}
                                                                                                showSearch
                                                                                                style={{ width: 180 }}
                                                                                                onChange={(val: string) => {
                                                                                                    // Reset operator and value when field changes
                                                                                                    form.change(`${conditionName}.operator`, '');
                                                                                                    form.change(`${conditionName}.value`, null);
                                                                                                }}
                                                                                            />
                                                                                        </Col>
                                                                                        <Col>
                                                                                            <FormField
                                                                                                name={`${conditionName}.operator`}
                                                                                                type="select"
                                                                                                placeholder="Select operator"
                                                                                                options={fieldConfig?.operators || []}
                                                                                                disabled={!condition?.field}
                                                                                                style={{ width: 150 }}
                                                                                            />
                                                                                        </Col>
                                                                                        <Col>
                                                                                            {renderValueInput(
                                                                                                conditionName,
                                                                                                condition?.field,
                                                                                                condition?.operator
                                                                                            )}
                                                                                        </Col>
                                                                                        <Col>
                                                                                            <IconButton type="danger" icon="trash-alt" onClick={() => conditionFields.remove(condIndex)} />
                                                                                        </Col>
                                                                                    </Row>
                                                                                </div>);
                                                                            })}

                                                                            <Button type="dashed" icon={<PlusOutlined />} block
                                                                                onClick={() => conditionFields.push({ field: '', operator: '', value: null })}
                                                                            >Add Condition</Button>
                                                                        </Space>)}
                                                                    </FieldArray>
                                                                </Card>
                                                            </div>
                                                        );
                                                    })}

                                                    <Button type="dashed" icon={<PlusOutlined />} block size="large"
                                                        onClick={() => groupFields.push({ logic: 'AND', conditions: [] })}
                                                    >Add Filter Group (OR)</Button>
                                                </>)}
                                            </FieldArray>
                                        </div>)
                                    },
                                    // Add starred filters as individual tabs
                                    ...savedFilters
                                        .filter(f => f.isFavorite)
                                        .map(filter => ({
                                            key: `filter-${filter.id}`,
                                            label: (
                                                <Space>
                                                    <StarFilled style={{ color: '#faad14' }} />
                                                    {filter.name}
                                                </Space>
                                            ),
                                            children: (
                                                <div>
                                                    <Card size="small" style={{ marginBottom: 16 }}>
                                                        <Space direction="vertical" style={{ width: '100%' }}>
                                                            <div>
                                                                <strong>{filter.name}</strong>
                                                                {filter.description && (
                                                                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                                                        {filter.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Space>
                                                                <Button
                                                                    type="primary"
                                                                    onClick={() => {
                                                                        loadFilter(filter, form);
                                                                        handleSubmit();
                                                                    }}
                                                                >
                                                                    Apply This Filter
                                                                </Button>
                                                                <Button onClick={() => loadFilter(filter, form)}>
                                                                    Edit Filter
                                                                </Button>
                                                                <Button
                                                                    icon={<StarFilled />}
                                                                    onClick={() => toggleFavorite(filter.id)}
                                                                >
                                                                    Remove from Favorites
                                                                </Button>
                                                                <Button
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => deleteFilter(filter.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </Space>
                                                        </Space>
                                                    </Card>
                                                    <div style={{ padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                                        <h4>Filter Configuration:</h4>
                                                        {filter.filterGroups.map((group, gIndex) => (
                                                            <div key={gIndex} style={{ marginBottom: 16 }}>
                                                                {gIndex > 0 && <Tag color="blue" style={{ marginBottom: 8 }}>OR</Tag>}
                                                                <Card size="small">
                                                                    <div style={{ marginBottom: 8 }}>
                                                                        <Tag color="green">Logic: {group.logic}</Tag>
                                                                    </div>
                                                                    {group.conditions.map((condition, cIndex) => {
                                                                        const fieldConfig = getFieldConfig(condition.field);
                                                                        return (
                                                                            <div key={cIndex} style={{ marginBottom: 8 }}>
                                                                                {cIndex > 0 && <Tag color={group.logic === 'AND' ? 'green' : 'orange'} style={{ marginRight: 8 }}>{group.logic}</Tag>}
                                                                                <Tag>{fieldConfig?.label || condition.field}</Tag>
                                                                                <Tag color="blue">{condition.operator}</Tag>
                                                                                {condition.value !== null && condition.value !== undefined && (
                                                                                    <Tag color="purple">{typeof condition.value === 'object' ? JSON.stringify(condition.value) : condition.value}</Tag>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </Card>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })),
                                    {
                                        key: 'all-filters',
                                        label: `All Filters (${savedFilters.length})`,
                                        children: renderSavedFilters(form)
                                    }
                                ]}
                            />
                        </form>

                        {/* Save Filter Modal */}
                        <Modal
                            title="Save Filter"
                            open={showSaveModal}
                            onCancel={() => setShowSaveModal(false)}
                            footer={null}
                        >
                            <FinalForm
                                onSubmit={handleSaveFilter}
                                render={(saveFormArgs) => (
                                    <form {...submitHandler(saveFormArgs)}>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <FormField
                                                name="filterName"
                                                type="text"
                                                label="Filter Name"
                                                placeholder="e.g., Active Store Managers"
                                            />
                                            <FormField
                                                name="filterDescription"
                                                type="textarea"
                                                label="Description (optional)"
                                                placeholder="Describe what this filter does"
                                                rows={3}
                                            />
                                            <Row justify="end" gutter={8}>
                                                <Col>
                                                    <Button onClick={() => setShowSaveModal(false)}>Cancel</Button>
                                                </Col>
                                                <Col>
                                                    <Button type="primary" onClick={saveFormArgs.handleSubmit}>
                                                        Save
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Space>
                                    </form>
                                )}
                            />
                        </Modal>
                    </Card>
                );
            }}
        />
    );
}
