import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { escapeText, string_to_slug } from '@_/lib/utill';
import { Button, DeleteButton, DevBlock, DrawerFooter, Icon, IconButton, ProdCatTreeSelection } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { useMutation, useLazyQuery } from '@apollo/client';
import { FormField, SubmitButton, rules, submitHandler, Label } from '@_/components/form';

import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'


export function ProdCategoriesFieldsForm({ initialValues, store, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            categories: values?.categories?.map(o => ({ _id: o._id, title: o.title })),
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
                onCatChange: (newValueArray, state, tools) => {
                    let cat = newValueArray[0];

                    if (!cat || cat.length < 1) tools.changeValue(state, 'categories', () => undefined)
                    else tools.changeValue(state, 'categories', () => cat)
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="ProdCategoriesFieldsForm" {...submitHandler(formargs)}>

                        <ProdCatTreeSelection name="categories" onChange={form.mutators.onCatChange} validate={rules.required} />

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
ProdCategoriesFieldsForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdCategoriesFieldsForm
