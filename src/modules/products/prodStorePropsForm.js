import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { catchApolloError, checkApolloRequestErrors, escapeText, string_to_slug } from '@_/lib/utill';
import { Button, DeleteButton, DevBlock, DrawerFooter, Icon, IconButton } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { useMutation, useLazyQuery } from '@apollo/client';
import { FormField, SubmitButton, rules, submitHandler, Label } from '@_/components/form';
import { publishStatus, tax_applition_on, tax_formula_types } from '@_/configs';

import RECORD_EDIT from '@_/graphql/product/editStoreProduct.graphql'


// const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

export function ProdStorePropsForm({ initialValues, store, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editStoreProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id_product: initialValues._id,
            // Store linked values
            _id_store: store._id,
            store_title: store.title,
            store_status: store.status,
            store_code: store.code,
            // Product linked values
            price_was: values.store.price_was || 0,
            price: values.store.price,
            available_qty: values.store.available_qty,
            status: values.store.status,
        }

        let results = await editStoreProduct({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.editStoreProduct }))
            .catch(catchApolloError)
        
        if (results.error) {
            message.error(results.error.message)
            setError(results.error.message)
            return false;
        }

        onSuccess(results);
        return false;
    }

    if (!store) return <Alert message="Missing store!" type='error' showIcon />

    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            mutators={{
                ...arrayMutators,
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="ProdStorePropsForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            <Col span={12}><FormField label="Price was" type="number" name="store.price_was" validate={rules.required} /></Col>
                            <Col span={12}><FormField label="Price" type="number" name="store.price" validate={rules.required} /></Col>
                            <Col span={12}><FormField label="Available Qty" type="number" name="store.available_qty" validate={rules.required} /></Col>
                            <Col span={12}><FormField label="Status" options={publishStatus} type="select" name="store.status" validate={rules.required} /></Col>
                        </Row>

                        <DrawerFooter><Row>
                            <Col flex="auto"><Button onClick={onCancel}>Cancel</Button></Col>
                            <Col><SubmitButton loading={submitting} disabled={invalid}>Save</SubmitButton></Col>
                        </Row></DrawerFooter>

                        <DevBlock obj={values} />

                    </form>
                </>)

            }}
        />


    </>)
}
ProdStorePropsForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdStorePropsForm
