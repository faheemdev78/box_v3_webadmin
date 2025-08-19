'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Alert, Space } from 'antd';
import { Drawer, Button, DevBlock, FileUploader } from '@_/components';
import { string_to_slug } from '@_/lib/utill';
import { publishStatus } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import { useMutation } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { ManufacturersDD } from '@_/components/dropdowns';


import RECORD_EDIT from '@_/graphql/brand/editBrand.graphql';
import RECORD_ADD from '@_/graphql/brand/addBrand.graphql';
import DELETE_IMG from '@_/graphql/brand/deleteBrandImg.graphql';

export const BrandForm = props => {
    const { onClose, callback } = props;
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [__fields, setFields] = useState(false);

    const [editBrand, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addBrand, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [deleteBrandImg, delImg_details] = useMutation(DELETE_IMG); // { data, loading, error }


    let fields = __fields ? { ...__fields } : props.fields ? { ...props.fields } : {}
    if (!props.open && __fields) setFields(false);

    const onSubmit = async (values) => {
        const _id = fields ? fields._id : false;

        let input = {
            title: values.title,
            code: values.code,
            slug: values.slug,
            manufacturer: {
                _id: values.manufacturer._id,
                title: values.manufacturer.title,
                code: values.manufacturer.code,
                slug: values.manufacturer.slug,
            },
            description: values.description,
            serial: values.serial,
            status: values.status,
            seo_title: values.seo_title,
            seo_desc: values.seo_desc,
            img: values.img,
            img_thumb: values.img_thumb
        };

        if (_id) {
            Object.assign(input, { _id })
            return _editBrand(input)
        }
        else return _addBrand(input)
    }

    const _editBrand = async (input) => {
        setLoading(true)
        let results = await editBrand({ variables: { input } })
            .then((r) => (r?.data?.editBrand))
        .catch(error => {
            console.error(error);
            return { error:{message:"Request Error!"}}
        });
        setLoading(false)

        if (!results || results.error){
            message.error((results || results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (callback) callback('updated', results)
        onClose(results);
    }
    
    const _addBrand = async (input) => {
        let results = await addBrand({ variables: { input }})
            .then((r) => (r.data.addBrand))
        .catch(error => {
            console.error(error);
            return { error: { message:"Request Error" } }
        });

        if (!results || results.error) {
            message.error((results || results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (callback) callback('added', results)
        onClose(results);
    }

    const onFileDeleteClicked = async (fileInfo) => {
        let srcField = fileInfo.name
        let src = fileInfo.srcUrl;
        let thumb = fileInfo.thumbUrl;
        let thumbField = fileInfo.name + "_thumb";

        setLoading(true)
        let resutls = await deleteBrandImg({
            variables: {
                id: fields._id, 
                field: `${srcField},${thumbField}`
            }
        }).then((r) => (r?.data?.deleteBrandImg))
        .catch(error => {
            console.error(error);
            return { error: { message: "Request Error" } };
        });
        setLoading(false)

        return resutls;
    }

    const onFileUploadClicked = async (fileInfo) => {
        console.log("fileInfo: ", fileInfo);
        return { error: { message: "onFileUploadClicked" } };
    }

   
    return (
        <Drawer width={600} destroyOnHidden maskClosable={false} placement="right"
            onClose={props.onClose}
            open={props.open}
            footer={false}
            title={`${fields && fields._id ? 'Edit' : 'Add'} Brand`}
        >
            <FinalForm onSubmit={onSubmit} initialValues={props.fields}
                mutators={{ 
                    ...arrayMutators,
                    onManufacturerChange: (newValueArray, state, tools) => {
                        let val = newValueArray[1];
                        console.log("onManufacturerChange: ", val)
                        tools.changeValue(state, 'manufacturer', () => val)
                    },

                }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="BrandForm" {...submitHandler(formargs)}>
                            <Row gutter={[10, 10]}>
                                <Col span={16}><FormField type="text" name="title" label="Title" validate={[rules.required, rules.minChar(4)]} /></Col>
                                <Col span={8}><FormField type="text" name="code" label="Code" validate={rules.required} /></Col>
                                <Col span={24}><ManufacturersDD preload onChange={form.mutators.onManufacturerChange} label="Manufacturer" name="manufacturer._id" validate={rules.required} /></Col>
                                <Col span={24}><FormField onChange={(e, onChange) => onChange(string_to_slug(e.target.value))} type="text" name="slug" label="Slug (no space)" validate={[rules.required, rules.nospace, rules.minChar(4)]} /></Col>
                                <Col span={16}><FormField type="text" name="serial" label="Serial" /></Col>
                                <Col span={8}><FormField type="select" name="status" label="Status" options={publishStatus} validate={rules.required} /></Col>
                                <Col span={24}><FormField type="textarea" name="description" label="Description" /></Col>
                                <Col span={24}><Divider>SEO Details</Divider></Col>
                                <Col span={24}><FormField type="text" name="seo_title" label="SEO Title" /></Col>
                                <Col span={24}><FormField type="text" name="seo_desc" label="SEO Desc" /></Col>
                                <Col span={24}></Col>
                            </Row>

                            {/* <FileUploader 
                                name="img"
                                // defaultValues={values?.gallery?.map(o => ({ ...o, url: `${o.url}`, thumb: `${o.thumb}` }))}
                                maxCount={10} 
                                multiple={true} 
                                // uploadFiles={uploadGalleryFiles}
                                // deleteFile={onGalleryFileDeleteClicked}
                            /> */}

                            <Row>
                                <Col flex="auto" />
                                <Col><SubmitButton loading={submitting} label={'Save'} /></Col>
                            </Row>

                            <DevBlock obj={values} title="values" />
                            
                        </form>
                    </>)

                }}
            />

        </Drawer>
    )
}
BrandForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    callback: PropTypes.func,
    fields: PropTypes.object,
}
