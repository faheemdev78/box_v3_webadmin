import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { escapeText, string_to_slug } from '@_/lib/utill';
import { Button, DeleteButton, DevBlock, DrawerFooter, Icon, IconButton } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { useMutation, useLazyQuery } from '@apollo/client';
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, FormFieldGroup, UploadField } from '@_/components/form';
import { BrandsDD, ProdAttributeDD, ProdTypeDD } from '@_/components/dropdowns';

import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'


const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

export function ProdVitalInfoForm({ initialValues, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            is_expirable: values.is_expirable===true,
            origon: values.origon,
            attributes: !values.attributes ? undefined : values.attributes.map(item => ({
                _id: item._id,
                val: item.val,
                title: item.title,
                slug: item.slug,
                code: item.code,
            })),
            is_temp_sensitive: values.is_temp_sensitive === true,
            type: !values.type ? undefined : { _id: values.type._id, title: values.type.title, slug: values.type.slug },
            fit_for_dispatch: values.fit_for_dispatch === true,
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
                onAttributeTypeChange: (newValueArray, state, tools) => {
                    let attributes = newValueArray[0];
                    let values = newValueArray[1].slice();
                    let index = newValueArray[2];

                    values[index] = attributes;

                    tools.changeValue(state, 'attributes', () => values)
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="ProdItendityForm" {...submitHandler(formargs)}>

                        <Space direction='vertical' size={20} style={{ width: "100%" }}>
                            <FormField checkedChildren="Yes" unCheckedChildren="No" type="switch" name="is_expirable">Is product expirable?</FormField>
                            <FormField label="Country/Regin or Origin" type="text" name="origon" validate={rules.required} />
                            <FieldArray name="attributes">
                                {({ fields }) => {
                                    return (<>
                                        <Space direction='vertical' size={10}>
                                            {fields.map((name, index) => {
                                                const thisNode = fields.value[index];

                                                return (<Space key={index}>
                                                    <ProdAttributeDD label="Attribute" name={`${name}._id`} preload validate={rules.required} wrapperStyle={{ minWidth: "200px" }}
                                                        onChange={(val, raw) => {
                                                            form.mutators.onAttributeTypeChange(raw, values.attributes, index)
                                                        }}
                                                    />
                                                    <FormField label="Value" type="text" name={`${name}.val`} validate={rules.required} />

                                                    {/* <div style={{ paddingTop:"15px" }}><DeleteButton onClick={() => fields.remove(index)} size="small" /></div> */}
                                                    <div style={{ paddingTop:"15px" }}><IconButton onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></div>
                                                </Space>)

                                            })}
                                            
                                            <div align="center" style={{ padding:"10px" }}><Button type="dashed" onClick={() => fields.push({})} icon={<Icon icon="plus" />}>Add Attribute</Button></div>
                                        </Space>
                                    </>)
                                }}
                            </FieldArray>
                            <FormField label="Is this item temperature sensitive?" checkedChildren="Yes" unCheckedChildren="No" type="switch" name="is_temp_sensitive" />
                            <ProdTypeDD label="Product Type" name="type._id" validate={rules.required} preload onChange={form.mutators.onTypeChange} />
                            <FormField label="Is this unfit for dispatch box?" checkedChildren="Yes" unCheckedChildren="No" type="switch" name="fit_for_dispatch" />
                        </Space>

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
ProdVitalInfoForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdVitalInfoForm
