'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Card, Space, Alert } from 'antd';
import { useMutation } from '@apollo/client';
import { DevBlock, Drawer } from '@_/components';
import { string_to_slug } from '@_/lib/utill';
import { __error, __yellow } from '@_/lib/consoleHelper';

import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';

import RECORD_ADD from '@_/graphql/product_attributes/addProductAttributes.graphql';
import RECORD_EDIT from '@_/graphql/product_attributes/editProductAttributes.graphql';

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));



const ProductAttributesForm_Comp = ({ onClose, callback, fields, open }) => {
    const [error, setError] = useState(false);

    const [addProductAttributes, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [editProductAttributes, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    const onSubmit = async (values) => {
        const _id = fields && fields?._id;

        let input = {
            title: values.title,
            code: values.code,
            required: values.required ? true : false,
            show_in_store: values.show_in_store ? true : false,
            displayAs: values.displayAs,
            options: values.options.split("\n").map(o=>(o.trim())).filter(o=>(o && o.length>0)),
            slug: values.slug || string_to_slug(values.title),
            seo: {
                title: values?.seo?.title,
                desc: values?.seo?.desc,
            }
        }
        
        if (_id) return _editProductAttributes({ ...input, _id })
        else return _addProductAttributes(input)
    }

    const _editProductAttributes = async (input) => {
        // console.log(__yellow("_editProductAttributes()"), input)

        let results = await editProductAttributes({ variables: { input } })
            .then((r) => (r?.data?.editProductAttributes))
            .catch(error => {
                console.error(error);
                return { error: { message: "Request Error!" } }
            });

        if (!results || results.error) {
            message.error((results || results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (callback) callback('updated', results)
        onClose(results);
    }

    const _addProductAttributes = async (input) => {
        // console.log(__yellow("_addProductAttributes()"), input)

        let results = await addProductAttributes({ variables: { input } })
            .then((r) => (r?.data?.addProductAttributes))
            .catch(error => {
                console.error(error);
                return { error: { message: "Request Error" } }
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
        <Drawer width={600} destroyOnHidden maskClosable={false} placement="right"
            onClose={onClose}
            open={open}
            footer={false}
            title={`${fields && fields._id ? 'Edit' : 'Add'} Product Attribute`}
        >
            <FinalForm onSubmit={onSubmit} initialValues={fields}
                // mutators={{ ...arrayMutators }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="ProductAttributesForm" {...submitHandler(formargs)}>
                            <Row gutter={[10, 10]}>
                                <Col span={16}><FormField type="text" name="title" label="Title" validate={[rules.required, rules.minChar(2)]} /></Col>
                                <Col span={8}>
                                    <FormField type="text" name="code" label="Attribute Code" validate={[rules.required, rules.nospace]} />
                                </Col>
                                <Col span={24}>
                                    <FormField type="textarea" name="options" placeholder={`Option 1\nOption 2\nOption....`} label="Options (add 1 option per line)" validate={rules.required} />
                                </Col>
                                <Col span={12} />
                                <Col span={12}><FormField type="select" name="displayAs" label="Display as" validate={rules.required}
                                options={[
                                    { value: 'text', label: "Text (only 1st line will be considered)"  },
                                    { value: 'radio', label: "Radio"  },
                                    { value: 'checkbox', label: "Checkbox"  },
                                    { value: 'dropdown', label: "Dropdown"  },
                                ]} /></Col>
                                <Col span={12}><FormField type="switch" name="required" label="This is a required field" /></Col>
                                <Col span={12}><FormField type="switch" name="show_in_store" label="Visible in store front" /></Col>
                                
                                <Col span={24}><Divider>SEO Details</Divider></Col>
                                <Col span={24}>
                                    <FormField onChange={filterSlug} type="text" name="slug" label="Slug (no space)" validate={[rules.nospace, rules.minChar(2)]} />
                                </Col>
                                <Col span={24}><FormField type="text" name="seo.title" label="SEO Title" /></Col>
                                <Col span={24}><FormField type="text" name="seo.desc" label="SEO Description" /></Col>

                                <Col span={24} align="right"><SubmitButton loading={submitting} label={'Save'} /></Col>
                            </Row>
                        </form>

                        <DevBlock obj={values} />
                    </>)

                }}
            />

        </Drawer>
    )
}

export const ProductAttributesForm = (props) => {

    let initialValues = { 
        ...props.fields,
        options: (props?.fields?.options?.length > 0) && props.fields.options.join('\n')
    }

    return <ProductAttributesForm_Comp {...props} fields={initialValues} />
}
ProductAttributesForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    callback: PropTypes.func,
    fields: PropTypes.object,
}
