'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Alert, Space } from 'antd';
import { __error } from '@_/lib/consoleHelper';
import { useMutation } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { Drawer } from '@_/components';

import RECORD_ADD from '@_/graphql/product_tags/addProductTag.graphql';
import RECORD_EDIT from '@_/graphql/product_tags/editProductTag.graphql';

export const ProdTagForm = props => {
    const { onClose, callback } = props;
    const [error, setError] = useState(false);
    const [__fields, setFields] = useState(false);

    const [editProductTag, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addProductTag, add_details] = useMutation(RECORD_ADD); // { data, loading, error }


    let fields = __fields ? { ...__fields } : props.fields ? { ...props.fields } : {}
    if (!props.open && __fields) setFields(false);

    const onSubmit = async (values) => {
        const _id = fields ? fields._id : false;

        let input = { title: values.title };

        if (_id) {
            Object.assign(input, { _id })
            return _editProductTag(input)
        }
        else return _addProductTag(input)
    }

    const _editProductTag = async (input) => {
        let results = await editProductTag({ variables: { input } })
            .then((r) => (r?.data?.editProductTag))
        .catch(error => {
            console.log(__error("Error: "), error);
            return { error:{message:"Request Error!"}}
        });

        if (!results || results.error){
            message.error((results || results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (callback) callback('updated', results)
        
        onClose(results);
    }
    
    const _addProductTag = async (input) => {
        let results = await addProductTag({ variables: { input }})
            .then((r) => (r.data.addProductTag))
            .catch(error => {
                console.log(__error("Error: "), error);
                return { error: { message:"Request Error" } }
            });

        if (!results || results.error) {
            message.error((results || results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (callback) callback('added', results)

        return "reset";
        // onClose(results);
    }
   
    return (
        <Drawer width={400} destroyOnHidden maskClosable={false} placement="right"
            onClose={props.onClose}
            open={props.open}
            footer={false}
            // footer={<>
            //     <span></span>
            //     <Button loading={loading} type="primary" onClick={() => {
            //         document.getElementById('ProdCatForm').dispatchEvent(new Event('submit', { cancelable: true }))
            //     }}>Save</Button>
            // </>}
            title={`${fields && fields._id ? 'Edit' : 'Add'} Tag`}
        >
            <FinalForm onSubmit={onSubmit} initialValues={props.fields}
                mutators={{ 
                    ...arrayMutators,
                }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="ProdTagForm" {...submitHandler(formargs)}>
                            <Space direction='vertical' style={{ width:"100%" }}>
                                <FormField type="text" name="title" label="Title" validate={[rules.required, rules.minChar(4)]} />
                                <Row>
                                    <Col flex="auto" />
                                    <Col><SubmitButton loading={submitting} label={'Save'} /></Col>
                                </Row>
                            </Space>
                        </form>
                    </>)

                }}
            />

        </Drawer>
    )
}
ProdTagForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    callback: PropTypes.func,
    fields: PropTypes.object,
}
