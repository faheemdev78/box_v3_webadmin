import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { Button, DeleteButton, DevBlock, DrawerFooter, Icon, IconButton } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { useMutation, useLazyQuery } from '@apollo/client';
import { FormField, SubmitButton, rules, submitHandler, Label, TagsManager } from '@_/components/form';

import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'


function ProdSEODataFormComp({ initialValues, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            tags: values?.tags?.join(), //?.toString(),
            meta: [
                { name: 'keywords', val: values?.meta?.keywords },  //values?.meta?.keywords?.toString() },
                { name: 'title', val: values?.meta?.title },
                { name: 'description', val: values?.meta?.description },
            ],
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

                        <Space direction='vertical' size={10} style={{ width:"100%" }}>
                            <div>
                                <Label style={{ marginTop: "3px", marginBottom: "2px" }}>Tags for local search</Label>
                                <div><TagsManager name="tags" /></div>
                            </div>

                            <FormField label="Keywords" type="text" name="meta.keywords" />
                            <FormField label="SEO Title" type="text" name="meta.title" />
                            <FormField label="Description" type="text" name="meta.description" />
                        </Space>

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

export function ProdSEODataForm(props){
    let initialValues = { 
        ...props.initialValues,
        tags: props.initialValues?.tags?.split(",")
    }

    return <ProdSEODataFormComp {...props} initialValues={initialValues} />
}
ProdSEODataForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdSEODataForm

