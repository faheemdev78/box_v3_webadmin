'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Alert, Space } from 'antd';
import { Drawer, Button, DevBlock, FileUploader, Icon, IconButton } from '@_/components';
import { string_to_slug } from '@_/lib/utill';
import { defaultDateTimeFormat, fieldDefinationCategories, fieldTypesArray, publishStatus } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import { useMutation } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField, Label } from '@_/components/form';
import { FieldArray } from 'react-final-form-arrays';

import ADD_RECORD from '@_/graphql/fields_definations/addFieldsDefination.graphql'
import EDIT_RECORD from '@_/graphql/fields_definations/editFieldsDefination.graphql'

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value, "_"));

export const FieldsDefinationForm = ({ initialValues, onClose, onSuccess, open }) => {
    const [error, setError] = useState(false);

    const [addFieldsDefination, add_details] = useMutation(ADD_RECORD); // { data, loading, error }
    const [editFieldsDefination, edit_details] = useMutation(EDIT_RECORD); // { data, loading, error }

    const onSubmit = async (values) => {
        let input = {
            label: values.label,
            name: values.name,
            type: values.type,
            required: !!(values.required),
            attributes: values?.attributes?.map(item => ({
                label: item.label,
                name: item.label,
                value: item.value
            })),
            options: values?.options?.map(item => ({
                label: item.label,
                name: item.name,
                value: item.value
            })),
            category: values.category,
            sort_order: values.sort_order || 0,
            valueType: values.valueType,
            defaultValue: values.defaultValue,
        };

        if (initialValues && initialValues._id) {
            Object.assign(input, { _id: initialValues._id })
            return _editRecord(input)
        }
        else return _addRecord(input)
    }

    const _editRecord = async (input) => {
        let results = await editFieldsDefination({ variables: { input } })
            .then((r) => (r?.data?.editFieldsDefination))
            .catch(error => {
                console.error(error)
                return { error: { message: "Request Error!" } }
            });

        if (!results || results.error) {
            message.error((results || results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (onSuccess) onSuccess('updated', results)
        onClose(results);
    }

    const _addRecord = async (input) => {
        let results = await addFieldsDefination({ variables: { input } })
            .then((r) => (r?.data?.addFieldsDefination))
            .catch(error => {
                console.error(error);
                return { error: { message: "Request Error" } }
            });

        if (!results || results.error) {
            message.error((results || results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (onSuccess) onSuccess('added', results)
        onClose(results);
    }


    return (
        <Drawer width={600} destroyOnHidden maskClosable={false} placement="right"
            title={`${initialValues && initialValues._id ? 'Edit' : 'Add'} Field`}
            onClose={onClose}
            open={open}
            footer={false}
        >
            <FinalForm onSubmit={onSubmit} initialValues={initialValues}
                mutators={{
                    ...arrayMutators,
                    onTypeChanged: (newValueArray, state, tools) => {
                        // let val = newValueArray[0];
                        tools.changeValue(state, 'defaultValue', () => undefined)
                        tools.changeValue(state, 'options', () => undefined)
                    },

                }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="FieldDefForm" {...submitHandler(formargs)}>
                            
                            <Row gutter={[10, 10]}>
                                <Col span={14} />
                                <Col span={10}><FormField type="select" options={fieldDefinationCategories} name="category" label="Category" validate={rules.required} /></Col>
                                <Col span={14}><FormField type="text" name="label" label="Label" validate={[rules.required, rules.minChar(4)]} /></Col>
                                <Col span={10}><FormField type="text" onChange={filterSlug} name="name" label="Field Name / Key" validate={[rules.required, rules.minChar(3)]} /></Col>
                                <Col span={14}><FormField type="select" onChange={form.mutators.onTypeChanged} options={fieldTypesArray} name="type" label="Type" validate={rules.required} allowClear /></Col>

                                {['text', 'email', 'number'].includes(values.type) && <Col span={24}>
                                    <FormField type={values.type} name="defaultValue" label="Default Value" allowClear />
                                </Col>}
                                {['textarea'].includes(values.type) && <Col span={24}>
                                    <FormField type="textarea" name="defaultValue" rows={2} label="Default Value" allowClear />
                                </Col>}
                                {['switch'].includes(values.type) && <Col span={24}>
                                    <FormField type="switch" name="defaultValue" label="Default Value" />
                                </Col>}
                                {['checkbox'].includes(values.type) && <Col span={24}>
                                    <FormField type="checkbox" name="defaultValue">{values.label}</FormField>
                                </Col>}
                                {['select'].includes(values.type) && <Col span={24}>
                                    <Divider>Select Options</Divider>
                                    <FieldArray name="options">
                                        {({ fields }) => {
                                            return (<>
                                                {fields.map((name, index) => {
                                                    const thisNode = fields.value[index];

                                                    return (<div key={index} style={{ marginBottom: "10px", border: "1px solid #EEE", padding: "10px", borderRadius: "5px" }}>
                                                        <Row className='nowrap'>
                                                            <Col span="auto"><Row gutter={[10]}>
                                                                <Col span={12}><FormField label="Label" type="text" name={`${name}.label`} validate={rules.required} /></Col>
                                                                <Col span={12}><FormField label="Value" type="text" name={`${name}.value`} validate={rules.required} /></Col>
                                                            </Row></Col>
                                                            <Col><IconButton style={{ marginTop: "15px" }} onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></Col>
                                                        </Row>
                                                    </div>)

                                                })}
                                                <div align="center" style={{ padding: "10px" }}><Button type="dashed" onClick={() => fields.push({})} icon={<Icon icon="plus" />}>Add Option</Button></div>
                                            </>)
                                        }}
                                    </FieldArray>
                                    {values?.options?.length > 0 && <FormField type="select" options={values.options} name="defaultValue" label="Default Value" allowClear />}
                                </Col>}
                                {['date'].includes(values.type) && <Col span={24}>
                                    <FormField type="date" name="defaultValue" label="Default Value" allowClear />
                                </Col>}
                                {['date-time'].includes(values.type) && <Col span={24}>
                                    <FormField type="date" name="defaultValue" label="Default Value" allowClear showTime format={defaultDateTimeFormat} />
                                </Col>}
                                {['radio-group'].includes(values.type) && <Col span={24}>
                                    <Divider>Radio Options</Divider>
                                    {values?.options?.length > 0 && <FormField type="select" options={values.options} name="defaultValue" label="Default Value" allowClear />}
                                    <FieldArray name="options">
                                        {({ fields }) => {
                                            return (<>
                                                {fields.map((name, index) => {
                                                    const thisNode = fields.value[index];

                                                    return (<div key={index} style={{ marginBottom: "10px", border: "1px solid #EEE", padding: "10px", borderRadius: "5px" }}>
                                                        <Row className='nowrap'>
                                                            <Col span="auto"><Row gutter={[10]}>
                                                                <Col span={12}><FormField label="Label" type="text" name={`${name}.label`} validate={rules.required} /></Col>
                                                                <Col span={12}><FormField label="Value" type="text" name={`${name}.value`} validate={rules.required} /></Col>
                                                            </Row></Col>
                                                            <Col><IconButton style={{ marginTop: "15px" }} onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></Col>
                                                        </Row>
                                                    </div>)

                                                })}
                                                <div align="center" style={{ padding: "10px" }}><Button type="dashed" onClick={() => fields.push({})} icon={<Icon icon="plus" />}>Add Option</Button></div>
                                            </>)
                                        }}
                                    </FieldArray>
                                </Col>}
                                <Col span={24}>
                                    <Divider>Attributes</Divider>
                                    <FieldArray name="attributes">
                                        {({ fields }) => {
                                            return (<>
                                                {fields.map((name, index) => {
                                                    const thisNode = fields.value[index];
            
                                                    return (<div key={index} style={{ marginBottom: "10px", border:"1px solid #EEE", padding:"10px", borderRadius:"5px" }}>
                                                        <Row className='nowrap'>
                                                            <Col span="auto"><Row gutter={[10]}>
                                                                <Col span={12}><FormField label="Label" type="text" name={`${name}.label`} validate={rules.required} /></Col>
                                                                <Col span={12}><FormField label="Name / Key" type="text" name={`${name}.name`} validate={rules.required} /></Col>
                                                                <Col span={24}>
                                                                    <FormField label="Value" type="text" name={`${name}.value`} validate={rules.required} />
                                                                </Col>
                                                            </Row></Col>
                                                            <Col><IconButton style={{ marginTop:"15px" }} onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></Col>
                                                        </Row>
                                                    </div>)
            
                                                })}
                                                <div align="center" style={{ padding: "10px" }}><Button type="dashed" onClick={() => fields.push({})} icon={<Icon icon="plus" />}>Add Attribute</Button></div>
                                            </>)
                                        }}
                                    </FieldArray>
                                </Col>
                                <Col span={12}><FormField wrapperStyle={{ marginTop: "20px" }} type="switch" name="required" label="Mark as required field" /></Col>
                                <Col span={12} align="right"><FormField type="number" name="sort_order" label="Sort Order" /></Col>
                                <Col span={24} align="right"><SubmitButton loading={submitting} label={'Save'} /></Col>
                            </Row>
                            
                            <DevBlock obj={values} title="values" />

                        </form>
                    </>)

                }}
            />

        </Drawer>
    )
}
FieldsDefinationForm.propTypes = {
    onClose: PropTypes.func,
    onSuccess: PropTypes.func,
    initialValues: PropTypes.object,
    open: PropTypes.bool,
}
