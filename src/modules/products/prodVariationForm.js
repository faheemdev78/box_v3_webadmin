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


export function ProdVariationForm({ initialValues, onSuccess, onCancel }) {
    const [error, setError] = useState(null)

    const [editProduct, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    async function onSubmit(values){
        setError(false);

        let input = {
            _id: initialValues._id,
            have_variations: (values.have_variations === true),
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

                        <FormField label="This product have Variations?" checkedChildren="Yes" unCheckedChildren="No" type="switch" name="have_variations" />

                        {values.have_variations === true && <></>}

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
ProdVariationForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
export default ProdVariationForm
