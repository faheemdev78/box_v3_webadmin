'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Alert } from 'antd';
import { Drawer, Button, DevBlock } from '@_/components';
import { string_to_slug } from '@_/lib/utill';
import { publishStatus } from '@_/configs';
import { ProdCatsDD } from '@_/components/dropdowns';
import { __error } from '@_/lib/consoleHelper';
import { useMutation } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
// import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';


import RECORD_EDIT from '@_/graphql/product_cat/editProductCat.graphql';
import RECORD_ADD from '@_/graphql/product_cat/addProductCat.graphql';
import DELETE_IMG from '@_/graphql/product_cat/deleteProductCatImg.graphql';

export const CategoriesForm = props => {

    const { onClose, callback } = props;
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [__fields, setFields] = useState(false);

    const [editProductCat, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addProductCat, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [deleteProductCatImg, delImg_details] = useMutation(DELETE_IMG); // { data, loading, error }


    let fields = __fields ? { ...__fields } : props.fields ? { ...props.fields } : {}
    if (!props.open && __fields) setFields(false);

    const onSubmit = async (values) => {
        const _id = fields ? fields._id : false;

        let input = {
            title: values.title,
            slug: values.slug,
            status: values.status,
            // menu_bg_img: values.menu_bg_img,
            // title_img: values.title_img,
            seo_title: values.seo_title,
            seo_desc: values.seo_desc,

            _id_parent_cat: values._id_parent_cat || null,
            parent_cat_title: values.parent_cat_title || null
        };

        if (_id) Object.assign(input, { _id })

        let results;

        setLoading(true)
        if (_id) results = await _editProductCat(input)
        else results = await _addProductCat(input)
        setLoading(false)

        if (results.error){
            message.error(results.error.message)
            return;
        }

        message.success("Success");
        if (callback) callback(_id ? 'updated' : 'added', results)
        onClose();
    }

    const _editProductCat = async (input) => {
        let results = await editProductCat({ variables: { input } })
            .then((r) => (r?.data?.editProductCat))
            .catch(error => {
                console.error(error)
                return { error:{message:"Request Error!"}}
            });

        if (!results || results.error) return { error: { message: (results || results?.error?.message) || "Invalid response" } }
        return results;
    }
    
    const _addProductCat = async (input) => {
        let results = await addProductCat({ variables: { input }})
            .then((r) => (r?.data?.addProductCat))
            .catch(error => {
                console.error(error)
                return { error: { message:"Request Error" } }
            });

        if (!results || results.error) return { error: { message: (results || results?.error?.message) || "Invalid response" } }
        return results;
    }

    const onFileDeleteClicked = async (fileInfo) => {
        let srcField = fileInfo.name
        let src = fileInfo.srcUrl;
        let thumb = fileInfo.thumbUrl;
        let thumbField = fileInfo.name + "_thumb";

        setLoading(true)
        let resutls = await deleteProductCatImg({
            variables: {
                id: fields._id, 
                field: `${srcField},${thumbField}`
            }
        }).then((r) => (r?.data?.deleteProductCatImg))
        .catch(error => {
            console.log(__error("Error: "), error);
            return { error: { message: "Request Error" } };
        });
        setLoading(false)

        return resutls;
    }

    const onFileUploadClicked = async (fileInfo) => {
        console.log("fileInfo: ", fileInfo);
        return { error: { message: "onFileUploadClicked" } };
    }

    // creating parent_cat json for dropdown
    var defaultCatData = [];
    if (fields && fields._id_parent_cat && fields.productCats) {
        defaultCatData = fields.productCats.find(o => o._id == fields._id_parent_cat)

        let _id = JSON.stringify({ _id: defaultCatData._id, title: defaultCatData.title });
        let title = defaultCatData.title;
        
        fields = Object.assign(fields, {
            parent_cat: _id //JSON.stringify({ _id: fields._id_parent_cat, title: fields.parent_cat_title })
        })

        defaultCatData = [{ _id, title }];
    }



    let menu_bg_img_recordPath = "product_cat.menu_bg_img";
    let menu_bg_img = (fields && fields._id && fields.menu_bg_img)
        ? [{
            _id: fields._id,
            // recordPath: menu_bg_img_recordPath,
            srcUrl: fields.menu_bg_img,
            thumbUrl: fields.menu_bg_img_thumb
        }]
        : null;

    let title_img_recordPath = "product_cat.title_img";
    let title_img = (fields && fields._id && fields.title_img)
        ? [{
            _id: fields._id,
            // recordPath: title_img_recordPath,
            srcUrl: fields.title_img,
            thumbUrl: fields.title_img_thumb
        }]
        : null;

    let icon_img_recordPath = "product_cat.icon_img";
    let icon_img = (fields && fields._id && fields.icon_img)
        ? [{
            _id: fields._id,
            // recordPath: title_img_recordPath,
            srcUrl: fields.icon_img,
            thumbUrl: fields.icon_img_thumb
        }]
        : null;

   
    return (
        <Drawer width={500} destroyOnHidden maskClosable={false} placement="right"
            onClose={props.onClose}
            open={props.open}
            footer={false}
            // footer={<>
            //     <span></span>
            //     <Button loading={loading} type="primary" onClick={() => {
            //         document.getElementById('ProdCatForm').dispatchEvent(new Event('submit', { cancelable: true }))
            //     }}>Save</Button>
            // </>}
            title={`${fields && fields._id ? 'Edit' : 'Add'} Product Category`}
        >
            <FinalForm onSubmit={onSubmit} initialValues={props.fields}
                mutators={{ 
                    ...arrayMutators,
                    onParentCatChange: (newValueArray, state, tools) => {
                        let data = newValueArray[1];
                        if (!data) tools.changeValue(state, `parent_cat_title`, () => undefined);
                        else tools.changeValue(state, `parent_cat_title`, () => (data.title));
                    },

                }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="ProdCatForm" {...submitHandler(formargs)}>
                            <Row gutter={[10, 10]}>
                                <Col span={24}>
                                    <FormField type="text" name="title" label="Title" validate={[rules.required, rules.minChar(4)]} />
                                </Col>
                                <Col span={24}>
                                    <FormField onChange={(e, onChange) => onChange(string_to_slug(e.target.value))} type="text" name="slug" label="Slug (no space)" validate={[rules.required, rules.nospace, rules.minChar(4)]} />
                                </Col>
                                <Col span={24}>
                                    <ProdCatsDD allowClear preload
                                        name="_id_parent_cat" label="Parent Category" black_list_ids={(fields && fields._id) ? `${fields._id}` : null}
                                        // onChange={form.mutators.onParentCatChange}
                                        // dataHandlr={(_data => {
                                        //     return _data.map(row => ({
                                        //         title: row.title,
                                        //         _id: JSON.stringify({ _id: row._id, title: row.title })
                                        //     }))
                                        // })}
                                        data={defaultCatData}
                                    />
                                </Col>
                                <Col span={24}>
                                    <FormField type="select" name="status" label="Status" options={publishStatus} validate={rules.required} />
                                </Col>
                                <Col span={24}></Col>
                            </Row>
                            
                            <Divider>SEO Details</Divider>
                            <Row gutter={[10, 10]}>
                                <Col span={24}>
                                    <FormField type="text" name="seo_title" label="SEO Title" />
                                </Col>
                                <Col span={24}>
                                    <FormField type="text" name="seo_desc" label="SEO Description" />
                                </Col>
                                <Col span={24}></Col>
                            </Row>
                            
                            <Divider>Images</Divider>

                            {/* {(!fields || !fields._id) && <div style={{ padding: '0 20px' }}>Save record to upload images</div>}

                            {fields && fields._id &&
                                <div style={{ align: "center", textAlign: "center" }}>
                                    <UploadField type="picture" listType="list"
                                        onDeleteClicked={onFileDeleteClicked} onUploadClicked={onFileUploadClicked}
                                        label="Menu Background Image" buttonLabel=" "
                                        name="menu_bg_img" fileList={menu_bg_img}
                                        data={{ fieldsJson: JSON.stringify({ _id: fields._id }), action: "product_cat" }}
                                    />
                                    <hr />
                                    <UploadField type="picture" listType="list"
                                        onDeleteClicked={onFileDeleteClicked} onUploadClicked={onFileUploadClicked}
                                        label="Category Title Image" buttonLabel=" "
                                        name="title_img" fileList={title_img}
                                        data={{ fieldsJson: JSON.stringify({ _id: fields._id }), action: "product_cat" }}
                                    />
                                    <hr />
                                    <UploadField type="picture" listType="list"
                                        onDeleteClicked={onFileDeleteClicked} onUploadClicked={onFileUploadClicked}
                                        label="Category Icon (75 x 75)" buttonLabel=" "
                                        name="icon_img" fileList={icon_img}
                                        data={{ fieldsJson: JSON.stringify({ _id: fields._id }), action: "product_cat" }}
                                    />
                                </div>
                            } */}

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

CategoriesForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    callback: PropTypes.func,
    fields: PropTypes.object,
}
