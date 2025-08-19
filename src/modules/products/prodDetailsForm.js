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
import { FieldArray } from 'react-final-form-arrays';

import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'


export function ProdDetailsForm({ initialValues, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            description: values.description,
            bullits: values.bullits,
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
                    <form id="ProdDetailsForm" {...submitHandler(formargs)}>

                        <Label>Product description</Label>
                        <FieldArray name="description">
                            {({ fields }) => {
                                return (<>
                                    {fields.map((name, index) => {
                                        const thisNode = fields.value[index];

                                        return (<div key={index} style={{ marginBottom: "10px" }}>
                                            <Row>
                                                <Col flex="auto"><FormField type="textarea" rows={2} name={name} validate={rules.required} /></Col>
                                                <Col><IconButton onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></Col>
                                            </Row>
                                        </div>)

                                    })}
                                    <div align="center" style={{ padding: "10px" }}><Button type="dashed" onClick={() => fields.push("")} icon={<Icon icon="plus" />}>Add Description</Button></div>
                                </>)
                            }}
                        </FieldArray>

                        <hr />

                        <Label>Bullit points</Label>
                        <FieldArray name="bullits">
                            {({ fields }) => {
                                return (<>
                                    {fields.map((name, index) => {
                                        const thisNode = fields.value[index];

                                        return (<div key={index} style={{ marginBottom: "10px" }}>
                                            <Row>
                                                <Col flex="auto"><FormField type="text" name={name} validate={rules.required} /></Col>
                                                <Col><IconButton onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></Col>
                                            </Row>
                                        </div>)

                                    })}
                                    <div align="center" style={{ padding: "10px" }}><Button type="dashed" onClick={() => fields.push("")} icon={<Icon icon="plus" />}>Add Bullits</Button></div>
                                </>)
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
ProdDetailsForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdDetailsForm;