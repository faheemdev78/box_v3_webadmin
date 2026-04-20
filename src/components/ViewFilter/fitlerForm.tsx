import React from 'react'
import { Form as FinalForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays';
import { submitHandler, FormField, SubmitButton, rules } from '@/components/form';
import { Card, Col, Divider, Row, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import DevBlock from '../devBlock';
// import { FilterBuilder } from './FilterBuilder';
import { Button, IconButton } from '../button';
import { ViewFilterConfig, FilterField } from './types';
import { Icon } from '../icon';

interface FilterBuilderProps {
    initialValues?: any;
    config: ViewFilterConfig;
    onSubmit?: (values: any) => Promise<any> | any;
    onCancel?: () => void;
}

function FitlerForm({ initialValues = {}, config, onSubmit, onCancel }: FilterBuilderProps) {
    const isEditing = !!initialValues._id;
    const formInitialValues = {
        name: '',
        description: '',
        visibility: 'private',
        filterGroups: [{ logic: 'AND', conditions: [] }],
        ...initialValues
    };

    async function onFormSubmit(values:any){
        if (!values?.name) return false;
        if (onSubmit) return onSubmit(values);
        return false;
    }

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
            return <FormField name={`${conditionName}.value`} type="text" placeholder="No value needed" disabled />;
        }

        switch (fieldConfig.type) {
            case 'text':
                return <FormField name={`${conditionName}.value`} type="text" placeholder="Enter value" />;

            case 'number':
                if (operator === 'between') {
                    return (
                        <Space>
                            <FormField name={`${conditionName}.value.min`} type="number" placeholder="Min" />
                            <span>to</span>
                            <FormField name={`${conditionName}.value.max`} type="number" placeholder="Max" />
                        </Space>
                    );
                }
                return <FormField name={`${conditionName}.value`} type="number" placeholder="Enter value" style={{ width:"100%" }} />;

            case 'select':
                const mode = ['in', 'not_in'].includes(operator) ? 'multiple' : undefined;
                return (
                    <FormField
                        name={`${conditionName}.value`}
                        type="select"
                        placeholder="Select value"
                        options={fieldConfig.options}
                        mode={mode}
                    />
                );

            case 'date':
                if (operator === 'between') return <FormField name={`${conditionName}.value`} type="date-range" />;
                return <FormField name={`${conditionName}.value`} type="date" />;

            default:
                return null;
        }
    };
    


    return (<div>
        <h3>{isEditing ? `Editing: ${initialValues.name}` : 'Create New'} View</h3>

        <FinalForm
            onSubmit={onFormSubmit}
            initialValues={formInitialValues}
            mutators={{ ...arrayMutators }}
            render={(formArgs) => {
                const { handleSubmit, form, values, submitting } = formArgs;

                return (<>
                    <form {...submitHandler(formArgs)}>
                        <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
                            <Col span={12}>
                                <FormField name="name" type="text" label="View Name" validate={rules.required} />
                            </Col>
                            <Col span={12}>
                                <FormField
                                    name="visibility"
                                    type="select"
                                    label="Visibility"
                                    options={[
                                        { label: 'Private', value: 'private' },
                                        { label: 'Team', value: 'team' },
                                        { label: 'Everyone', value: 'everyone' }
                                    ]}
                                    validate={rules.required}
                                />
                            </Col>
                            <Col span={24}>
                                <FormField name="description" type="textarea" label="Description" placeholder="Optional description" />
                            </Col>
                        </Row>

                        <FieldArray name="filterGroups">
                            {({ fields: groupFields }) => (<>
                                {groupFields.map((groupName, groupIndex) => {
                                    const group = groupFields.value[groupIndex];
                                    console.log("group:", group)

                                    return (
                                        <div key={groupName}>
                                            {groupIndex > 0 && (<Divider style={{ margin: '16px 0' }}><Tag color="blue">OR</Tag></Divider>)}

                                            <Card size="small" styles={{ body:{ padding:0 } }}
                                                title={<Space>
                                                    <span>Group {groupIndex + 1}</span>
                                                    <Button size="small"
                                                        onClick={() => {
                                                            console.log("group.logic: ", group.logic)
                                                            const newLogic = group.logic === 'AND' ? 'OR' : 'AND';
                                                            console.log("newLogic: ", newLogic)
                                                            groupFields.update(groupIndex, { ...group, logic: newLogic })
                                                        }}
                                                    >
                                                        {group.logic || 'AND'}
                                                    </Button>
                                                </Space>}
                                                extra={(groupFields.length || 0) > 1 && (<IconButton shape="round"
                                                    onClick={() => groupFields.remove(groupIndex)} 
                                                    icon={<Icon icon="trash-alt" />}
                                                />)}
                                            >
                                                <FieldArray name={`${groupName}.conditions`}>
                                                    {({ fields: conditionFields }) => (
                                                        <Space orientation="vertical" style={{ width: '100%' }}>
                                                            {conditionFields.map((conditionName, condIndex) => {
                                    const condition = conditionFields.value[condIndex];
                                    const fieldConfig = getFieldConfig(condition?.field);

                                    const totalConditions = conditionFields?.length || 0;

                                    return (<div key={conditionName} style={{ borderBottom: `${condIndex !== (totalConditions - 1) ? '1' : '0'}px dashed #DDD`, padding: "10px" }}>
                                                                    {condIndex > 0 && (
                                                                        <Tag color={group.logic === 'AND' ? 'green' : 'orange'} style={{ marginBottom: 8 }}>{group.logic || 'AND'}</Tag>
                                                                    )}
                                        <Space orientation="vertical" style={{ width: '100%' }}>
                                                                        <Row gutter={[5, 5]} align="middle">
                                                                            <Col span={8}>
                                                                                <FormField
                                                                                    name={`${conditionName}.field`}
                                                                                    type="select"
                                                                                    placeholder="Select field"
                                                                                    options={config.filterFields.map(f => ({ label: f.label, value: f.key }))}
                                                                                    showSearch
                                                                                    onChange={() => {
                                                                                        // Reset operator and value when field changes
                                                                                        form.change(`${conditionName}.operator`, '');
                                                                                        form.change(`${conditionName}.value`, null);
                                                                                    }}
                                                                                />
                                                                            </Col>
                                                                            <Col span={8}>
                                                                                <FormField
                                                                                    name={`${conditionName}.operator`}
                                                                                    type="select"
                                                                                    placeholder="Select operator"
                                                                                    options={fieldConfig?.operators || []}
                                                                                    disabled={!condition?.field}
                                                                                />
                                                                            </Col>
                                                                            <Col span={8} style={{ textAlign: "right" }}><IconButton danger icon="trash-alt" onClick={() => conditionFields.remove(condIndex)} /></Col>
                                                                            <Col span={24}>
                                                                                {renderValueInput( conditionName, condition?.field, condition?.operator )}
                                                                            </Col>
                                                                            <Col span={24} style={{ textAlign: "right" }}><FormField name={`${conditionName}.isChangeable`} type="checkbox">Mark this as variable value</FormField></Col>                                                                                
                                                                        </Row>
                                                                    </Space>
                                                                </div>);
                                                            })}

                                                            <Button type="dashed" icon={<PlusOutlined />} block onClick={() => conditionFields.push({ field: '', operator: '', value: null })}>Add Condition</Button>
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

                        <div style={{ marginTop: 18, textAlign: "right" }}>
                            <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
                            <SubmitButton loading={submitting} label={isEditing ? "Update View" : "Save View"} color="primary" />
                        </div>

                    </form>

                    <DevBlock obj={values} />
                </>);
            }}
        />

    </div>)
}

export default FitlerForm
