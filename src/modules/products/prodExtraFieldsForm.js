import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { Button, DeleteButton, DevBlock, DrawerFooter, Icon, IconButton, Loader } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { useMutation, useLazyQuery } from '@apollo/client';
import { FormField, SubmitButton, rules, submitHandler, Label } from '@_/components/form';
import { FieldArray } from 'react-final-form-arrays';

import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'
import GET_EXTRA_FIELDS from '@_/graphql/fields_definations/fieldsDefinations.graphql'

function ProdExtraFieldsFormComp({ initialValues, onSuccess, onCancel }) {
    const [error, setError] = useState(null)
    
    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            extra_fields: values?.extra_fields?.map(field => ({
                _id: field._id,
                label: field.label,
                name: field.name,
                type: field.type,
                required: field.required,
                attributes: field.attributes.map(o=>({
                    _id: o._id,
                    label: o.label,
                    name: o.name,
                    value: o.value
                })),
                category: field.category,
                sort_order: Number(field.sort_order || 0),
                options: field?.options?.map(o=>({
                    label: o.label,
                    value: o.value,
                })),
                defaultValue: field.defaultValue,
                value: field.value
            })),            
        }

        let results = await editProduct({ variables: { input } }).then(r => (r?.data?.editProduct))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Request Error!" } }
            })
        
        if (results.error) {
            message.error(results.error.message)
            setError(results.error.message)
            return false;
        }

        onSuccess(results);
        return false;
    }


    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            mutators={{
                ...arrayMutators,
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="ProdExtraInfosForm" {...submitHandler(formargs)}>

                        <FieldArray name="extra_fields">
                            {({ fields }) => {
                                return (<Space style={{ width: "100%" }} direction='vertical' size={20}>
                                    {fields.map((name, index) => {
                                        const thisNode = fields.value[index];

                                        return (<Row gutter={[10, 20]} align="top" key={index}>
                                            {['text', 'email', 'number'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label>{thisNode.label}</Label></Col>
                                                <Col span={16}><FormField type={thisNode.type} name={`${name}.value`} validate={thisNode.required && rules.required} /></Col>
                                            </>}
                                            {['textarea'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label>{thisNode.label}</Label></Col>
                                                <Col span={16}><FormField type={thisNode.type} name={`${name}.value`} rows={2} validate={field.required && rules.required} /></Col>
                                            </>}
                                            {['switch'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label>{thisNode.label}</Label></Col>
                                                <Col span={16}><FormField type={thisNode.type} name={`${name}.value`} /></Col>
                                            </>}
                                            {['checkbox'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label></Label></Col>
                                                <Col span={16}><FormField type="checkbox" name={`${name}.value`} validate={thisNode.required && rules.required}>{thisNode.label}</FormField></Col>
                                            </>}
                                            {['select'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label>{thisNode.label}</Label></Col>
                                                <Col span={16}><FormField type={thisNode.type} options={thisNode.options} name={`${name}.value`} validate={thisNode.required && rules.required} allowClear /></Col>
                                            </>}
                                            {['date'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label>{thisNode.label}</Label></Col>
                                                <Col span={16}><FormField type={thisNode.type} name={`${name}.value`} validate={thisNode.required && rules.required} allowClear /></Col>
                                            </>}
                                            {['date-time'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label>{thisNode.label}</Label></Col>
                                                <Col span={16}><FormField type={thisNode.type} name={`${name}.value`} validate={thisNode.required && rules.required} allowClear showTime format={defaultDateTimeFormat} /></Col>
                                            </>}
                                            {['radio-group'].includes(thisNode.type) && <>
                                                <Col span={8} align="right"><Label>{thisNode.label}</Label></Col>
                                                <Col span={16}><FormField type={thisNode.type} options={thisNode.options} name={`${name}.value`} validate={thisNode.required && rules.required} /></Col>
                                            </>}
                                        </Row>)

                                    })}
                                </Space>)
                            }}
                        </FieldArray>


                        <DrawerFooter><Row>
                            <Col flex="auto"><Button onClick={onCancel}>Cancel</Button></Col>
                            <Col><SubmitButton loading={submitting} disabled={invalid}>Save</SubmitButton></Col>
                        </Row></DrawerFooter>

                        {/* <DevBlock obj={values} /> */}

                    </form>
                </>)

            }}
        />


    </>)
}

export function ProdExtraFieldsForm (props) {
    const [fetalError, setFetalError] = useState(null)

    const [fieldsDefinations, { called, loading, data }] = useLazyQuery(GET_EXTRA_FIELDS,
        { variables: { filter: JSON.stringify({}), others: JSON.stringify({ sort: { sort_order: 1 } }) } }
    );

    useEffect(() => {
        if (called) return;
        fetchExtraFields()
    }, [props])

    async function fetchExtraFields() {
        let results = await fieldsDefinations({
            variables: {
                filter: JSON.stringify({})
            }
        }).then(r => r?.data?.fieldsDefinations)
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: (err.message || "Unable to fetch Extra Fields") } }
            })

        if (results && results.error) {
            setFetalError(results.error.message);
            return;
        }
    }

    let initialValues = {...props.initialValues};

    if (loading || !called) return <Loader loading={true} />

    if (data && data.fieldsDefinations){
        let extra_fields = []; // initialValues?.extra_fields?.slice() || [];

        data.fieldsDefinations.forEach(field => {
            var value = "";
            if (initialValues?.extra_fields){
                value = initialValues?.extra_fields?.find(o => (o._id == field._id))?.value || "";
            }
            extra_fields.push({ ...field, value })
        });

        Object.assign(initialValues, { extra_fields })
    }

    return <ProdExtraFieldsFormComp {...props} initialValues={initialValues} />
}
ProdExtraFieldsForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdExtraFieldsForm;
