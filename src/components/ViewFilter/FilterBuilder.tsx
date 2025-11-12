'use client'

import React from 'react'
import { Button, Row, Col, Space, Tag, Divider, Card } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { FieldArray } from 'react-final-form-arrays';
import { FormField } from '@_/components/form';
import { IconButton } from '@_/components';
import { ViewFilterConfig, FilterField } from './types';

interface FilterBuilderProps {
    config: ViewFilterConfig;
    form: any;
}

export function FilterBuilder({ config, form }: FilterBuilderProps) {
    // Get field configuration
    const getFieldConfig = (fieldKey: string): FilterField | undefined => {
        return config.filterFields.find(f => f.key === fieldKey);
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

    return <p>FilterBuilder</p>

    return (<>
        <FieldArray name="filterGroups">
            {({ fields: groupFields }) => (<>
                {groupFields.map((groupName, groupIndex) => {
                    const group = groupFields.value[groupIndex];

                    return (
                        <div key={groupName}>
                            {groupIndex > 0 && (
                                <Divider style={{ margin: '16px 0' }}>
                                    <Tag color="blue">OR</Tag>
                                </Divider>
                            )}

                            <Card
                                size="small"
                                style={{ marginBottom: 16 }}
                                title={
                                    <Space>
                                        <span>Filter Group {groupIndex + 1}</span>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                const newLogic = group.logic === 'AND' ? 'OR' : 'AND';
                                                form.change(`${groupName}.logic`, newLogic);
                                            }}
                                        >
                                            {group.logic || 'AND'}
                                        </Button>
                                    </Space>
                                }
                                extra={
                                    (groupFields.length || 0) > 1 && (
                                        <Button
                                            size="small"
                                            danger
                                            icon={<CloseOutlined />}
                                            onClick={() => groupFields.remove(groupIndex)}
                                        >
                                            Remove Group
                                        </Button>
                                    )
                                }
                            >
                                <FieldArray name={`${groupName}.conditions`}>
                                    {({ fields: conditionFields }) => (
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            {conditionFields.map((conditionName, condIndex) => {
                                                const condition = conditionFields.value[condIndex];
                                                const fieldConfig = getFieldConfig(condition?.field);

                                                return (
                                                    <div key={conditionName}>
                                                        {condIndex > 0 && (
                                                            <Tag
                                                                color={group.logic === 'AND' ? 'green' : 'orange'}
                                                                style={{ marginBottom: 8 }}
                                                            >
                                                                {group.logic || 'AND'}
                                                            </Tag>
                                                        )}
                                                        <Space direction="vertical" style={{ width: '100%' }}>
                                                            <Row gutter={8} align="middle">
                                                                <Col>
                                                                    <FormField
                                                                        name={`${conditionName}.field`}
                                                                        type="select"
                                                                        placeholder="Select field"
                                                                        options={config.filterFields.map(f => ({
                                                                            label: f.label,
                                                                            value: f.key
                                                                        }))}
                                                                        showSearch
                                                                        style={{ width: 180 }}
                                                                        onChange={() => {
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
                                                                    <FormField
                                                                        name={`${conditionName}.isChangeable`}
                                                                        type="checkbox"
                                                                        label="Changeable"
                                                                    />
                                                                </Col>
                                                                <Col>
                                                                    <IconButton
                                                                        type="danger"
                                                                        icon="trash-alt"
                                                                        onClick={() => conditionFields.remove(condIndex)}
                                                                    />
                                                                </Col>
                                                            </Row>
                                                        </Space>
                                                    </div>
                                                );
                                            })}

                                            <Button
                                                type="dashed"
                                                icon={<PlusOutlined />}
                                                block
                                                onClick={() => conditionFields.push({ field: '', operator: '', value: null })}
                                            >
                                                Add Condition
                                            </Button>
                                        </Space>
                                    )}
                                </FieldArray>
                            </Card>
                        </div>
                    );
                })}

                <Button type="dashed" icon={<PlusOutlined />} block size="large" onClick={() => groupFields.push({ logic: 'AND', conditions: [] })}>Add Filter Group (OR)</Button>
            </>)}
        </FieldArray>
    </>);
}
