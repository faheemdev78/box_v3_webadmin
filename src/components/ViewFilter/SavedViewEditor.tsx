'use client'

import React from 'react'
import { Card, Button, Space, Tag, Row, Col, Collapse, Alert, Divider, TagProps } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';
import { Form as FinalForm } from 'react-final-form';
import { FormField } from '@/components/form';
import { ViewConfig, ViewFilterConfig, FilterCondition } from './types';

const SmallTag = (props:TagProps) => (<Tag {...props} style={{ ...props.style, fontSize:"10px" }} />)

interface SavedViewEditorProps {
    view: ViewConfig;
    config: ViewFilterConfig;
    onApply: (modifiedFilters: ViewConfig) => void;
}

/**
 * SavedViewEditor - Shows a saved view's filters with ability to modify "changeable" fields
 *
 * This component displays:
 * 1. Non-changeable filters (read-only, shown as tags)
 * 2. Changeable filters (editable form fields)
 * 3. Apply button to apply the modified filters
 */
export function SavedViewEditor({ view, config, onApply }: SavedViewEditorProps) {

    // Get field configuration
    const getFieldConfig = (fieldKey: string) => {
        return config.filterFields.find(f => f.key === fieldKey);
    };

    // Get operator label
    const getOperatorLabel = (fieldKey: string, operatorValue: string) => {
        const fieldConfig = getFieldConfig(fieldKey);
        const operator = fieldConfig?.operators.find(op => op.value === operatorValue);
        return operator?.label || operatorValue;
    };

    // Separate changeable and non-changeable conditions
    const getAllConditions = () => {
        const all: { condition: FilterCondition; groupIndex: number; conditionIndex: number }[] = [];
        view.filterGroups.forEach((group, gIndex) => {
            group.conditions.forEach((condition, cIndex) => {
                all.push({ condition, groupIndex: gIndex, conditionIndex: cIndex });
            });
        });
        return all;
    };

    const allConditions = getAllConditions();
    const changeableConditions = allConditions.filter(c => c.condition.isChangeable);
    const nonChangeableConditions = allConditions.filter(c => !c.condition.isChangeable);

    // Create initial values for changeable fields
    const getInitialValues = () => {
        const values: any = {};
        changeableConditions.forEach((item, index) => {
            values[`changeable_${index}`] = item.condition.value;
        });
        return values;
    };

    // Handle apply with modified values
    const handleApply = (values: any) => {
        // Clone the view
        const modifiedView: ViewConfig = JSON.parse(JSON.stringify(view));

        // Update changeable field values
        changeableConditions.forEach((item, index) => {
            const newValue = values[`changeable_${index}`];
            modifiedView.filterGroups[item.groupIndex].conditions[item.conditionIndex].value = newValue;
        });

        onApply(modifiedView);
    };

    // Render value input based on field type and operator
    const renderChangeableInput = (condition: FilterCondition, index: number) => {
        const fieldConfig = getFieldConfig(condition.field);
        if (!fieldConfig) return null;

        const fieldName = `changeable_${index}`;
        const operator = condition.operator;

        // Operators that don't need value input
        const noValueOperators = ['is_empty', 'is_not_empty', 'last_7_days', 'last_30_days', 'this_month', 'last_month'];
        if (noValueOperators.includes(operator)) {
            return <Tag>No value needed</Tag>;
        }

        switch (fieldConfig.type) {
            case 'text':
                return (
                    <FormField
                        name={fieldName}
                        type="text"
                        placeholder="Enter value"
                        style={{ width: 250 }}
                    />
                );

            case 'number':
                if (operator === 'between') {
                    return (
                        <Space>
                            <FormField
                                name={`${fieldName}.min`}
                                type="number"
                                placeholder="Min"
                                style={{ width: 120 }}
                            />
                            <span>to</span>
                            <FormField
                                name={`${fieldName}.max`}
                                type="number"
                                placeholder="Max"
                                style={{ width: 120 }}
                            />
                        </Space>
                    );
                }
                return (
                    <FormField
                        name={fieldName}
                        type="number"
                        placeholder="Enter value"
                        style={{ width: 250 }}
                    />
                );

            case 'select':
                const mode = ['in', 'not_in'].includes(operator) ? 'multiple' : undefined;
                return (
                    <FormField
                        name={fieldName}
                        type="select"
                        placeholder="Select value"
                        options={fieldConfig.options}
                        mode={mode}
                        style={{ width: 250 }}
                    />
                );

            case 'date':
                if (operator === 'between') {
                    return (
                        <FormField
                            name={fieldName}
                            type="date-range"
                            style={{ width: 300 }}
                        />
                    );
                }
                return (
                    <FormField
                        name={fieldName}
                        type="date"
                        style={{ width: 250 }}
                    />
                );

            default:
                return null;
        }
    };

    // Render value display for non-editable fields
    const renderValueDisplay = (value: any) => {
        if (value === null || value === undefined) return <Tag>-</Tag>;
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return (<Space wrap>
                    {value.map((v, i) => <Tag key={i} color="purple">{String(v)}</Tag>)}
                </Space>);
            }
            // Object (e.g., min/max)
            return <Tag color="purple">{JSON.stringify(value)}</Tag>;
        }
        return <Tag color="purple">{String(value)}</Tag>;
    };

    return (<div>
        {view.description && <Alert message={view.description} type='info' showIcon />}

        <Card size="small" title="View Filter" style={{ marginBottom: 16 }}>
            <FinalForm
                onSubmit={handleApply}
                initialValues={getInitialValues()}
                render={(formArgs) => {
                    const { handleSubmit, pristine, form } = formArgs;
                    return (<div>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            {allConditions.map((item, index) => {
                                const fieldConfig = getFieldConfig(item.condition.field);
                                const isChangeable = !!item.condition.isChangeable;

                                if (isChangeable) return (<div key={index}>
                                    <Row gutter={8} align="middle">
                                        <Col flex="200px">
                                            <Space>
                                                <Tag color="green">{fieldConfig?.label || item.condition.field}</Tag>
                                                <Tag color="cyan">{getOperatorLabel(item.condition.field, item.condition.operator)}</Tag>
                                            </Space>
                                        </Col>
                                        <Col flex="auto">
                                            {renderChangeableInput(item.condition, index)}
                                        </Col>
                                    </Row>
                                </div>)


                                return (<div key={index}>
                                    <Row gutter={8}>
                                        <Col>
                                            <Tag color="blue">{fieldConfig?.label || item.condition.field}</Tag>
                                        </Col>
                                        <Col>
                                            <Tag color="cyan">
                                                {getOperatorLabel(item.condition.field, item.condition.operator)}
                                            </Tag>
                                        </Col>
                                        <Col>
                                            {renderValueDisplay(item.condition.value)}
                                        </Col>
                                    </Row>
                                </div>)

                            })}
                        </Space>

                    </div>);
                }}
            />

            <Divider>Filter View</Divider>
            <Space direction="vertical" style={{ width: '100%' }}>
                {view.filterGroups.map((group, gIndex) => (<div key={gIndex}>
                    <Card size="small" styles={{ body:{ padding:'3px' } }}>
                        {gIndex > 0 && <Tag color="blue" style={{ marginBottom: 8 }}>OR</Tag>}

                        <div><Tag color="green">Logic: {group.logic}</Tag></div>

                        {group.conditions.map((condition, cIndex) => {
                            const fieldConfig = getFieldConfig(condition.field);

                            return (<div key={cIndex}>
                                {cIndex > 0 && (<Tag color={group.logic === 'AND' ? 'green' : 'orange'} style={{ marginRight: 8 }}>
                                    {group.logic}
                                </Tag>)}
                                <Tag color="blue">{fieldConfig?.label || condition.field}</Tag>
                                <Tag color="cyan">{getOperatorLabel(condition.field, condition.operator)}</Tag>
                                {renderValueDisplay(condition.value)}
                                {condition.isChangeable && <Tag color="orange">Changeable</Tag>}
                            </div>);
                        })}

                    </Card>
                </div>))}
            </Space>
        </Card>




        

        <hr />

        {/* Non-changeable Filters (Read-only) */}
        {nonChangeableConditions.length > 0 && (
            <Card size="small" title="Fixed Filters" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {nonChangeableConditions.map((item, index) => {
                        const fieldConfig = getFieldConfig(item.condition.field);
                        return (<Row key={index} gutter={8}>
                            <Col>
                                <Tag color="blue">{fieldConfig?.label || item.condition.field}</Tag>
                            </Col>
                            <Col>
                                <Tag color="cyan">
                                    {getOperatorLabel(item.condition.field, item.condition.operator)}
                                </Tag>
                            </Col>
                            <Col>
                                {renderValueDisplay(item.condition.value)}
                            </Col>
                        </Row>);
                    })}
                </Space>
            </Card>
        )}

        {/* Changeable Filters (Editable) */}
        {changeableConditions.length > 0 ? (
            <FinalForm
                onSubmit={handleApply}
                initialValues={getInitialValues()}
                render={(formArgs) => {
                    const { handleSubmit, pristine, form } = formArgs;

                    return (<div>
                        <Card
                            size="small"
                            title={<Space><EditOutlined /> Changeable Filters</Space>}
                            extra={<Space>
                                {!pristine && (<Button size="small" onClick={() => form.reset()}>Reset</Button>)}
                                <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleSubmit}>Apply</Button>
                            </Space>}
                            style={{ marginBottom: 16 }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                {changeableConditions.map((item, index) => {
                                    const fieldConfig = getFieldConfig(item.condition.field);
                                    return (<div key={index}>
                                        <Row gutter={8} align="middle">
                                            <Col flex="200px">
                                                <Space>
                                                    <Tag color="green">{fieldConfig?.label || item.condition.field}</Tag>
                                                    <Tag color="cyan">{getOperatorLabel(item.condition.field, item.condition.operator)}</Tag>
                                                </Space>
                                            </Col>
                                            <Col flex="auto">
                                                {renderChangeableInput(item.condition, index)}
                                            </Col>
                                        </Row>
                                    </div>);
                                })}
                            </Space>
                        </Card>
                    </div>);
                }}
            />
        ) : (
            <Card size="small" style={{ marginBottom: 16, textAlign: 'center', color: '#999' }}>
                No changeable filters in this view. All filters are fixed.
            </Card>
        )}

        {/* Filter Groups Detail (Collapsible) */}
        <Collapse
            size="small"
            items={[
                {
                    key: '1',
                    label: 'View Full Filter Configuration',
                    children: (<Space direction="vertical" style={{ width: '100%' }}>
                        {view.filterGroups.map((group, gIndex) => (<div key={gIndex}>
                            {gIndex > 0 && <Tag color="blue" style={{ marginBottom: 8 }}>OR</Tag>}
                            <Card size="small">
                                <div style={{ marginBottom: 8 }}><Tag color="green">Logic: {group.logic}</Tag></div>
                                {group.conditions.map((condition, cIndex) => {
                                    const fieldConfig = getFieldConfig(condition.field);
                                    return (<div key={cIndex} style={{ marginBottom: 8 }}>
                                        {cIndex > 0 && (<Tag color={group.logic === 'AND' ? 'green' : 'orange'} style={{ marginRight: 8 }}>
                                            {group.logic}
                                        </Tag>)}
                                        <Tag color="blue">{fieldConfig?.label || condition.field}</Tag>
                                        <Tag color="cyan">{getOperatorLabel(condition.field, condition.operator)}</Tag>
                                        {renderValueDisplay(condition.value)}
                                        {condition.isChangeable && <Tag color="orange">Changeable</Tag>}
                                    </div>);
                                })}
                            </Card>
                        </div>))}
                    </Space>)
                }
            ]}
        />
    </div>);
}
