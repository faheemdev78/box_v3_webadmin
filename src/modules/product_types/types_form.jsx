'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Card, Space, Alert } from 'antd';
import { useMutation } from '@apollo/client';
import { Drawer, Button, DevBlock, IconButton, ProdAttributesSelector } from '@_/components';
import { string_to_slug } from '@_/lib/utill';
import { __error } from '@_/lib/consoleHelper';
import { taxTypes } from '@_/configs';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, submitHandler } from '@_/components/form';


import RECORD_EDIT from '@_/graphql/product_type/editProductType.graphql';
import RECORD_ADD from '@_/graphql/product_type/addProductType.graphql';

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

const updateAttributes = (val, state, tools) => {
    if (val && val[0] && val[0].length > 0) tools.changeValue(state, 'attributes', () => val[0])
    else tools.changeValue(state, 'attributes', () => null)
}


export const ProductTypesForm = props => {
    const { onClose, callback, fields } = props;
    const [error, setError] = useState(false);
    const [showAttrSelector, set_showAttrSelector] = useState(false);

    const [editProductType, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addProductType, add_details] = useMutation(RECORD_ADD); // { data, loading, error }

    const onSubmit = async (values) => {
        if (!values.attributes || values.attributes.length < 1 || !values?.attributes[0]?._id) {
            message.error("You forgot to assign attributes!")
            return false;
        }

        const _id = fields && fields?._id;

        let tax;
        if (!values?.tax?.unit || values.tax.unit == 'null' || !values?.tax?.value || values.tax.value < 1) tax = null;
        else tax = { value: values?.tax?.value, unit: values?.tax?.unit }

        let input = {
            title: values.title,
            slug: values.slug,
            tax,
            seo_title: values.seo_title,
            seo_desc: values.seo_desc,
            attributes: values?.attributes?.map(item => ({
                _id: item._id,
                title: item.title,
                slug: item.slug,
                code: item.code,
                required: item.required,
                show_in_store: item.show_in_store,
                values: item.values,
                displayAs: item.displayAs,
                seo_title: item.seo_title,
                seo_desc: item.seo_desc
            })),
        }
        if (_id) Object.assign(input, { _id })


        if (_id) return _editProductType(input)
        else return _addProductType(input)
    }

    const _editProductType = async (input) => {
        let results = await editProductType({ variables: { input } })
            .then((r) => (r?.data?.editProductType))
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

    const _addProductType = async (input) => {
        let results = await addProductType({ variables: { input } })
            .then((r) => (r?.data?.addProductType))
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
        return "reset"
        // onClose(results);
    }


    return (<>
        <Drawer width={400} destroyOnHidden maskClosable={false} placement="right"
            styles={{ body: { backgroundColor: "#EEEEEE", padding: "5px" } }}
            onClose={props.onClose}
            open={props.open}
            footer={false}
            title={`${fields && fields._id ? 'Edit' : 'Add'} Product Type`}
        ><>
            <FinalForm onSubmit={onSubmit} initialValues={fields || {}}
                mutators={{
                    ...arrayMutators,
                    updateAttributes,
                    onSelectAttribute: (newValueArray, state, tools) => {
                        let data = newValueArray[1];
                        if (!data) return;

                        let attributes = state?.formState?.values?.attributes?.slice() || [];
                        attributes.push(data)

                        tools.changeValue(state, `attributes`, () => attributes);
                        tools.changeValue(state, `attr_selection`, () => undefined);

                        // tools.changeValue(state, `attr_selection`, () => undefined);

                        // if (!data) tools.changeValue(state, `attr_selection`, () => undefined);
                        // else tools.changeValue(state, `attr_selection`, () => (data));
                    },
                    // addAttribute: (newValueArray, state, tools) => {
                    //     let data = newValueArray[0];
                    //     let attributes = newValueArray[1];
                    //         attributes = (attributes && attributes.slice()) || [];

                    //     if (!attributes.find(o => o._id == data._id)) attributes.push(data)

                    //     tools.changeValue(state, `attr_selection`, () => undefined);
                    //     tools.changeValue(state, `attributes`, () => attributes);
                    // },

                }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="ProdTypeForm" {...submitHandler(formargs)}>
                            <Card>
                                
                                <Row gutter={[10, 10]}>
                                    <Col span={24}><FormField type="text" name="title" label="Title" validate={[rules.required, rules.minChar(4)]} /></Col>
                                    <Col span={24}><FormField type="text" onChange={filterSlug} name="slug" label="Slug (no space)" validate={[rules.required, rules.nospace, rules.minChar(4)]} /></Col>
                                    
                                    <Col span={24}><Divider>Tax Settings</Divider></Col>
                                    <Col><FormField type="select" width={"70px"} name="tax.unit" options={taxTypes} compact allowClear /></Col>
                                    <Col><FormField type="number" disabled={values.tax && !values?.tax?.unit} min={0} max={100} name="tax.value" compact allowClear /></Col>
                                    
                                    <Col span={24}><Divider>Attributes</Divider></Col>
                                    <Col span={24}><Button onClick={() => set_showAttrSelector(true)}>Select Attributes</Button></Col>
                                    <Col span={24}>
                                        <div style={{ height: "10px" }} />
                                        <FieldArray name="attributes">
                                            {({ fields }) => (<Space direction='vertical' style={{ width: "100%" }}>
                                                {fields.map((name, index) => {
                                                    const thisNode = fields.value[index];

                                                    return <Row key={index} align="middle" style={{ border: "1px solid #EEE", borderRadius: "10px", padding: "5px" }}>
                                                        <Col flex="auto">{thisNode.title}</Col>
                                                        <Col><IconButton onClick={() => fields.remove(index)} icon="trash-alt" /></Col>
                                                    </Row>

                                                })}
                                            </Space>)}
                                        </FieldArray>
                                    </Col>
                                    
                                    <Col span={24}><Divider>SEO Details</Divider></Col>
                                    <Col span={24}><FormField type="text" name="seo_title" label="SEO Title" /></Col>
                                    <Col span={24}><FormField type="text" name="seo_desc" label="SEO Description" /></Col>
                                    
                                    <Col span={24} align="right"><SubmitButton loading={submitting} label={'Save'} /></Col>
                                    <Col span={24}></Col>
                                    <Col span={24}></Col>
                                </Row>
                                
                            </Card>


                            <Drawer width={400} maskClosable={true} placement="right"
                                styles={{ body: { backgroundColor: "#EEEEEE", padding: "5px" } }}
                                onClose={() => set_showAttrSelector(false)}
                                open={showAttrSelector !== false}
                                footer={false}
                                title="Select Attributes"
                            >
                                <ProdAttributesSelector initialValues={values.attributes} onUpdate={form.mutators.updateAttributes} />
                            </Drawer>



                            <DevBlock obj={values} />

                        </form>
                    </>)

                }}
            />

        </></Drawer>

    </>)
}
ProductTypesForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    callback: PropTypes.func,
    fields: PropTypes.object,
}
