import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { escapeText, string_to_slug } from '@_/lib/utill';
import { Button, DeleteButton, DevBlock, DrawerFooter, Icon, IconButton } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { useMutation, useLazyQuery } from '@apollo/client';
import { FormField, SubmitButton, rules, submitHandler, Label } from '@_/components/form';
import { tax_applition_on, tax_formula_types } from '@_/configs';

import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'


const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

export function ProdLimitsForm({ initialValues, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            cart_limit: Number(values.cart_limit || 0),
            stock_level: { min: Number(values?.stock_level?.min || 0), max: Number(values?.stock_level?.max || 0) },
            cost: Number(values.cost || 0),
            tax: {
                texable: (values?.tax?.texable === true),
                formula: values?.tax?.formula,
                amount: Number(values?.tax?.amount || 0),
                hs_code: values?.tax?.hs_code,
                applied_at: values?.tax?.applied_at
            },
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
                    <form id="ProdItendityForm" {...submitHandler(formargs)}>

                        <Space direction='vertical' size={20} style={{ width: "100%" }}>
                            <FormField label="Cart limit" type="number" name="cart_limit" validate={rules.required} />

                            <Space>
                                <Label style={{ marginTop:"20px" }}>Stock level</Label>
                                <FormField label="Min" type="number" name="stock_level.min" validate={rules.required} />
                                <FormField label="Max" type="number" name="stock_level.max" validate={rules.required} />
                            </Space>
                            <FormField label="Cost" type="number" name="cost" validate={rules.required} />

                            <Divider><>
                                <FormField _label="This product is texable" checkedChildren="Taxable" unCheckedChildren="Non-Taxable" type="switch" name="tax.texable" />
                            </></Divider>

                            {values?.tax?.texable && <Space size={5}>
                                <FormField type="text" label="HS Code" name="tax.hs_code" validate={rules.required} />
                                <FormField options={tax_applition_on} type="select" label="Tax amount to be applied at" name="tax.applied_at" validate={rules.required} />
                            </Space>}

                            {values?.tax?.texable && <Space size={5}>
                                <FormField wrapperStyle={{ width: '80px' }} options={tax_formula_types} type="select" label="Tax Formula" compact name="tax.formula" />
                                <FormField wrapperStyle={{ width: '80px' }} type="number" label="Amount" name="tax.amount" compact min={0} />
                            </Space>}

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
ProdLimitsForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdLimitsForm
