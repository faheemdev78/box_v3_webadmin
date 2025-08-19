import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { escapeText, string_to_slug } from '@_/lib/utill';
import { Button, DevBlock, DrawerFooter } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { useMutation, useLazyQuery } from '@apollo/client';
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, FormFieldGroup, UploadField } from '@_/components/form';
import { BrandsDD } from '@_/components/dropdowns';

import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'


const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

export function ProdItendityForm({ initialValues, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            title: values.title,
            slug: values.slug,
            no_brand: (values.no_brand === true),
            // brand: (values.no_brand !== true && values?.brand?._id) ? { _id: values.brand._id, title: values.brand.title } : undefined,
            brand: (values.no_brand === true) ? undefined : { _id: values.brand._id, title: values.brand.title },
            no_barcode: (values.no_barcode === true),
            barcode: (values.no_barcode === true) ? undefined : values.barcode,
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
                onBrandChange: (newValueArray, state, tools) => {
                    let val = newValueArray[0];
                    tools.changeValue(state, 'brand', () => val || undefined)
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="ProdItendityForm" {...submitHandler(formargs)}>

                        <Space direction='vertical' size={20} style={{ width: "100%" }}>
                            <FormField type="text" name="title" label="Title" validate={[rules.required, rules.minChar(4)]} />
                            <FormField onChange={filterSlug} type="text" name="slug" label="Slug (no space)" validate={[rules.required, rules.nospace, rules.minChar(4)]} />
                            {/* <FormField type="textarea" rows={2} name="short_description" label="Short Description" validate={[rules.required, rules.minChar(4)]} /> */}

                            <div>
                                <BrandsDD name="brand._id" label="Brand" preload disabled={values.no_brand} allowClear required={!values.no_brand}
                                    validate={(value, allValues) => !allValues.no_brand ? rules.required(value) : undefined}
                                    onChange={(val1, val2) => form.mutators.onBrandChange(val2)}
                                />
                                <FormField onChange={(val) => {
                                    if (val) form.mutators.onBrandChange(false)
                                }}
                                wrapperStyle={{ marginTop:"5px" }} type="checkbox" name="no_brand">This product does not have a brand name</FormField>
                            </div>
                            
                            <div>
                                <FormField type="text" name="barcode" label="Barcode" disabled={values.no_barcode} required={!values.no_barcode}
                                    validate={(value, allValues) => !allValues.no_barcode ? rules.required(value) : undefined}
                                />
                                <FormField wrapperStyle={{ marginTop: "5px" }} type="checkbox" name="no_barcode">{escapeText("I don't have a product barcode")}</FormField>
                            </div>
                            
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
ProdItendityForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdItendityForm;
