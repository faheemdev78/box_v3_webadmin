'use client'
import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { Barcode, ProdCatTreeSelection, BarcodeScanner, Button, Icopn, DevBlock, Loader, FileUploader, IconButton, Icon } from '@_/components';
import { BrandsDD, ProdAttributeDD, ProdTypeDD } from '@_/components/dropdowns';
import { message, Row, Col, Drawer, Card, Divider, Alert, Space, Steps, Popconfirm, Tag, Input, Flex, Tooltip, theme } from 'antd';
import { adminRoot, publishStatus, tax_applition_on, tax_formula_types } from '@_/configs';
import { escapeText, sleep, string_to_slug, uploadFile, uploadFiles } from '@_/lib/utill';
import { __error, __yellow } from '@_/lib/consoleHelper';
import security from '@_/lib/security';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, FormFieldGroup, UploadField, Label as FormLabel, TagsManager } from '@_/components/form';
import Image from 'next/image';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';



import RECORD from '@_/graphql/product/product.graphql'
import RECORD_EDIT from '@_/graphql/product/editProduct.graphql'
import RECORD_ADD from '@_/graphql/product/addProduct.graphql'
import DELETE_PROD_IMG from '@_/graphql/product/deleteProductImg.graphql'
import DELETE_PROD_GALL_IMG from '@_/graphql/product/deleteGalleryItem.graphql'

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));
const Label = ({ children, style }) => (<FormLabel style={{ marginTop: "7px", ...style }}>{children}</FormLabel>)

// const imagePreset = [
//     // { type: "image", cat:"main" },
//     // { type: "video", cat: "gallery" },
//     { },
//     { },
//     { },
//     { },
//     { },
//     { },
// ]

const stepsArray = [
    { title: 'Product Category' },
    { title: 'Product Identity' },
    { title: 'Vital Info' },
    { title: 'Pricing' },
    { title: 'Product Details' },
    // { title: 'Variations' },
    { title: 'Images' },
    { title: 'Shopping' },
    { title: 'Keywords' },
]

function ensureArrayLength(arr, targetLength) {
    while (arr.length < targetLength) {
        arr.push({}); // Add an empty object until the array reaches the target length
    }
    return arr;
}

const defaultValues = {
    gallery: Array.from({ length: 6 }, () => ({})),
    is_expirable: false,
    temperature_sensitive: false,
    is_temp_sensitive: false,
    status: 'online',
    available_qty: 0,
    cart_limit: 10,
    stock_level: { min: 10, max: 10 },
    cost: 0,
    price_was: 0,
}


function CreateProductForm ({ initialValues }) {
    const [error, setError] = useState(null)
    const [activeStep, set_activeStep] = useState(0)
    const formRef = useRef();
    const router = useRouter()
    const [messageApi, contextHolder] = message.useMessage();

    const [addProduct, add_details] = useMutation(RECORD_ADD); // { data, loading, error }

    const onSubmit = async (values) => {
        const { picture, video, gallery } = values;
        // console.log(__yellow("onSubmit()"), values)
        setError(null)

        if (activeStep < stepsArray.length){
            set_activeStep(activeStep+1)
            return false;
        }

        let _input = {
            categories: values?.categories?.map(o=>({ _id: o._id, title: o.title })),
            title: values.title,
            slug: values.slug,
            have_variations: (values.have_variations ===true),
            
            no_brand: (values.no_brand===true),
            brand: (values.no_brand !== true && values?.brand?._id) ? { _id: values.brand._id, title: values.brand.title } : undefined,
            no_barcode: (values.no_barcode===true),
            barcode: values.barcode,
            is_expirable: (values.is_expirable===true),
            origon: values.origon,
            // attribute: !values.attribute ? undefined : [{ 
            //     _id: values.attribute._id, 
            //     val: values.attribute.val,
            //     title: values.attribute.title,
            //     slug: values.attribute.slug,
            //     code: values.attribute.code,
            // }],
            attribute: !values.attribute ? undefined : values.attribute.map(item => ({
                _id: item._id,
                val: item.val,
                title: item.title,
                slug: item.slug,
                code: item.code,
            })),
            is_temp_sensitive: (values.is_temp_sensitive ===true),
            type: !values.type ? undefined : { _id: values.type._id, title: values.type.title, slug: values.type.slug },
            status: values.status || "draft",
            // available_qty: Number(values.available_qty || 0),
            cart_limit: Number(values.cart_limit || 0),
            stock_level: { min: Number(values?.stock_level?.min || 0), max: Number(values?.stock_level?.max || 0) },
            cost: Number(values.cost || 0),
            // price: Number(values.price || 0),
            // price_was: Number(values.price_was || 0),
            tax: {
                texable: (values?.tax?.texable === true),
                formula: values?.tax?.formula,
                amount: Number(values?.tax?.amount || 0),
                hs_code: values?.tax?.hs_code,
                applied_at: values?.tax?.applied_at
            },
            description: values.description,
            bullits: values.bullits,

            // picture: !values.picture ? undefined : {
            //     name: values.picture.name,
            //     url: values.picture.url,
            //     thumb: values.picture.thumb,
            //     type: values.picture.type,
            //     width: Number(values.picture.width || 0),
            //     height: Number(values.picture.height || 0),
            //     size: Number(values.picture.size || 0),
            // },

            // video: !values.video ? undefined : {
            //     name: values.video.name,
            //     url: values.video.url,
            //     thumb: values.video.thumb,
            //     type: values.video.type,
            //     width: Number(values.video.width || 0),
            //     height: Number(values.video.height || 0),
            //     size: Number(values.video.size || 0),
            // },

            // gallery: values?.gallery?.map(o=>({
            //     name: o.name,
            //     url: o.url,
            //     thumb: o.thumb,
            //     type: o.type,
            //     width: Number(o.width || 0),
            //     height: Number(o.height || 0),
            //     size: Number(o.size || 0),
            // })) || undefined,

            fit_for_dispatch: (values.fit_for_dispatch === true),
            tags: values?.tags?.join(), //?.toString(),
            meta: [
                { name: 'keywords', val: values?.meta?.keywords },  //values?.meta?.keywords?.toString() },
                { name: 'title', val: values?.meta?.title },
                { name: 'description', val: values?.meta?.description },
            ],
        }

        messageApi.open({ key:"onSubmit", type: 'loading', content: 'Saving..' })

        let results = await _addProduct(_input);
        if (results.error) {
            messageApi.open({ key: "onSubmit", type: 'error', content: results.error.message, duration: 3 })
            setError(results.error.message)
            return false;
        }

        // var results = { _id: 123 }

        if (picture || video || gallery){
            messageApi.open({ key: "onSubmit", type: 'loading', content: "Uploading images & video...", duration: 3 })
            
            if (picture){
                let picture_upload = await onUpdateMainFile(picture, results._id)
                // if (!picture_upload || picture_upload.error) message.error((picture_upload || picture_upload?.error?.message) || "Unable to upload main picture")
                // else Object.assign(_input, { picture: picture_upload })
            }
            if (video){
                let video_upload = await onUpdateVideoFile(video, results._id)
                // if (!video_upload || video_upload.error) message.error((video_upload || video_upload?.error?.message) || "Unable to upload video")
                // else Object.assign(_input, { video: video_upload })
            }
            if (gallery){
                let gallery_upload = await onUpdateGalleryFiles(gallery, results._id)
                // if (!gallery_upload || gallery_upload.error) message.error((gallery_upload || gallery_upload?.error?.message) || "Unable to upload gallery")
                // else Object.assign(_input, { gallery: gallery_upload })
            }
        }

        // console.log("_input: ", _input)
        messageApi.open({ key: "onSubmit", type: 'success', content: "Saved", duration: 3 })
        onSuccess(results);
        return false;
    }

    const onSuccess = () => router.push(`${adminRoot}/products`);

    const _addProduct = async (input) => {
        let results = await addProduct({ variables: { input } }).then(r => (r?.data?.addProduct))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Request Error!" } }
            })

        return results;
    }

    const uploadProdImage = async (files) => {
        return true;
        const file = files[0]

        const formData = new FormData();
        const data = {
            uploadPath: "prod",
            uploadType: "prod-img",
            _id: editNode._id,
        }
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        // Append files, ensuring each is a File object
        if (!(file.originFileObj instanceof File)) {
            message.error("File object not found!")
            return false;
        }
        formData.append('files', file.originFileObj); // Append each file

        try {
            const results = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(r => ((r.data.error) ? r.data : r?.data?.files));
            // .then(r=>(r.data))
            return results.error ? results : [{ ...results, _id: data._id }]
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data || error.message) } }
        }
    }

    const onUpdateMainFile = async (files, _id) => {
        console.log(__yellow("onUpdateMainFile()"), files)

        const file = files
        if (!file) {
            console.log(__yellow("No picture file found to uplaod"))
            return false;
        }

        const formData = new FormData();
        const data = { uploadPath: "prod", uploadType: "prod-img", _id }
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        // Append files, ensuring each is a File object
        if (!(file.originFileObj instanceof File)) {
            message.error("File object not found!")
            return false;
        }
        formData.append('files', file.originFileObj); // Append each file

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving product image" })

        try {
            const results = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(r => ((r.data.error) ? r.data : r?.data?.files));
            
            return results.error ? results : [{ ...results, _id: data._id }]
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data || error.message) } }
        }

    }
    const onUpdateVideoFile = async (files, _id) => {
        console.log(__yellow("onUpdateVideoFile()"), files)

        const file = files
        if (!file) {
            console.log(__yellow("No video file found to uplaod"))
            return false;
        }

        const formData = new FormData();
        const data = { uploadPath: "prod", uploadType: "prod-video", _id }
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        // Append files, ensuring each is a File object
        if (!(file.originFileObj instanceof File)) {
            message.error("File object not found!")
            return false;
        }
        formData.append('files', file.originFileObj); // Append each file

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving product video" })

        try {
            const results = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(r => ((r.data.error) ? r.data : r?.data?.files));

            return results.error ? results : [{ ...results, _id: data._id }]
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data || error.message) } }
        }

    }
    const onUpdateGalleryFiles = async (_files, _id) => {
        console.log(__yellow("onUpdateGalleryFiles()"), _files)

        const files = _files
            .filter(o => (o.originFileObj instanceof File))
            .map(o => (o.originFileObj))

        if (!files || files.length < 1) {
            console.log(__yellow("No gallery pictures file found to uplaod"))
            return false;
        }

        const formData = new FormData();
        const data = { uploadPath: "prod", uploadType: "prod-gallery", _id }
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        // // Append files, ensuring each is a File object
        // if (!(file.originFileObj instanceof File)) {
        //     message.error("File object not found!")
        //     return false;
        // }
        // formData.append('files', files); // Append each file
        files.forEach(file => {
            formData.append('files', file); // Append each file
        });

        messageApi.open({ key: "onSubmit", type: 'loading', content: `Saving product gallery (${files.length})` })

        try {
            const results = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(r => ((r.data.error) ? r.data : r?.data?.files));

            return results.error ? results : [{ ...results, _id: data._id }]
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data || error.message) } }
        }

    }

    const onProdImageDelete = async (file) => {
        return;
        let resutls = await deleteProductImg({ variables: { _id_product: editNode._id } })
            .then(r => (r?.data?.deleteProductImg))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to delete Image" } }
            })
        return resutls.error ? resutls : [];
    }


    return (<>
        {contextHolder}

        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            mutators={{
                ...arrayMutators,
                onCatChange: (newValueArray, state, tools) => {
                    let cat = newValueArray[0];

                    if (!cat || cat.length < 1) tools.changeValue(state, 'categories', () => undefined)
                    else tools.changeValue(state, 'categories', () => cat)
                },
                onBrandChange: (newValueArray, state, tools) => {
                    let val = newValueArray[0];
                    tools.changeValue(state, 'brand', () => val || undefined)
                },
                onTypeChange: (newValueArray, state, tools) => {
                    let val = newValueArray[1];
                    tools.changeValue(state, 'type', () => val)
                },
                onAttributeTypeChange: (newValueArray, state, tools) => {
                    let attributes = newValueArray[0];
                    let values = newValueArray[1].slice();
                    let index = newValueArray[2];

                    values[index] = attributes;

                    tools.changeValue(state, 'attribute', () => values)
                },
                calculateTotalTax: (newValueArray, state, tools) => {
                    let { amount, formula, price } = newValueArray[0];

                    if (!amount || amount < 1 || !formula || !price || price<1) tools.changeValue(state, 'suffix_tax_total', () => undefined)
                    else if (formula == 'fix') tools.changeValue(state, 'suffix_tax_total', () => amount)
                    else if (formula == 'percent') tools.changeValue(state, 'suffix_tax_total', () => Number((price / 100) * amount).toFixed(2))
                },
                onUpdateMainFile: (newValueArray, state, tools) => {
                    // console.log("onUpdateMainFile: ", newValueArray)
                    let file = newValueArray[0][0]
                    let action = newValueArray[1]

                    if (action=='add') tools.changeValue(state, 'picture', () => file)
                    if (action=='remove') tools.changeValue(state, 'picture', () => undefined)
                },
                onUpdateVideoFile: (newValueArray, state, tools) => {
                    // console.log("onUpdateVideoFile: ", newValueArray)
                    let file = newValueArray[0][0]
                    let action = newValueArray[1]

                    if (action == 'add') tools.changeValue(state, 'video', () => file)
                    if (action == 'remove') tools.changeValue(state, 'video', () => undefined)
                    // tools.changeValue(state, 'video', () => (newValueArray && newValueArray[0][0]) || undefined)
                },
                onUpdateGalleryFiles: (newValueArray, state, tools) => {
                    // console.log("onUpdateGalleryFiles: ", newValueArray)
                    let file = newValueArray[0][0]
                    let action = newValueArray[1]

                    let gallery = state?.formState?.values?.gallery?.slice() || []
                        gallery = gallery.filter(o=>!!(o.uid))


                    if (action == 'add') {
                        gallery.push(file)
                        gallery = ensureArrayLength(gallery, 6)
                        tools.changeValue(state, 'gallery', () => gallery)
                    }
                    if (action == 'remove') {
                        gallery = gallery.filter(o=>!(o.uid==file.uid))
                        gallery = ensureArrayLength(gallery, 6)
                        tools.changeValue(state, 'gallery', () => gallery)
                    }

                    // let images = Array.from({ length: 6 }, () => ({}))

                    // if (newValueArray && newValueArray.length > 0) newValueArray.forEach((file, index) => {
                    //     images[index] = file;
                    // });

                    // tools.changeValue(state, 'gallery', () => images)
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;
                formRef.current = form;

                return (<>
                    <form id="CreateProductForm" {...submitHandler(formargs)} style={{ border: "0px solid black", minHeight: "100%" }}>

                        <Row className='nowrap' style={{ border: "0px solid black", minHeight: "100%" }}>
                            <Col flex="300px">
                                <p>Picture</p>
                                <p>Title</p>
                                <p>Barcode</p>
                                <p>Categories</p>
                                <p>Attributes filter</p>
                            </Col>
                            <Col flex="auto" style={{ backgroundColor: "#FFF" }}>
                                {error && <Alert message={error} showIcon type='error' />}

                                <div style={{ padding:"20px 100px 50px 100px" }}><Steps progressDot current={activeStep} items={stepsArray} /></div>

                                <div align="center">
                                    <div style={{ width: "800px", textAlign: "left", padding: "0 0 50px 0" }}>

                                        {/* <FieldArray name="gallery">
                                            {({ fields }) => {
                                                return (<>
                                                    {fields.map((name, index) => {
                                                        const thisNode = fields.value[index];

                                                        return (<Col key={index} span={6} align="center">
                                                            <FileUploader
                                                                name={name}
                                                                thumbnail={{ displaySize: { width: "190px", height: "190px" } }}
                                                                maxCount={1}
                                                                multiple={false}
                                                                debounceTime={100}
                                                                // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}` }]}
                                                                // uploadFiles={uploadProdImage}
                                                                // deleteFile={onProdImageDelete}
                                                                onUpdateFiles={form.mutators.onUpdateGalleryFiles}
                                                            />
                                                        </Col>)

                                                    })}
                                                </>)
                                            }}
                                        </FieldArray> */}

                                        {activeStep == 0 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight:"bold", fontSize:"18px" }}>Select a product category</Divider>

                                            <Row gutter={[0, 20]}>
                                                <Col span={24}>
                                                    <ProdCatTreeSelection name="categories" onChange={form.mutators.onCatChange} />
                                                    <FormField type="hidden" name="categories" validate={rules.required} />
                                                </Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 1 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Product Identity</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label style={{ margin: 0 }}>This product have Variations?</Label></Col>
                                                <Col span={16}><FormField checkedChildren="Yes" unCheckedChildren="No" type="switch" name="have_variations" /></Col>

                                                <Col span={8} align="right"><Label>Product Name</Label></Col>
                                                <Col span={16}><FormField type="text" name="title" validate={rules.required} /></Col>
                                                <Col span={8} align="right"><Label>Slug</Label></Col>
                                                <Col span={16}><FormField prefix={`/`} type="text" name="slug" onChange={filterSlug} validate={rules.required} /></Col>

                                                <Col span={8} align="right"><Label>Brand Name</Label></Col>
                                                <Col span={16}>
                                                    <BrandsDD name="brand._id" preload disabled={values.no_brand} allowClear required={!values.no_brand}
                                                        validate={(value, allValues) => !allValues.no_brand ? rules.required(value) : undefined}
                                                        onChange={(val1, val2) => form.mutators.onBrandChange(val2)}
                                                    />
                                                    <FormField onChange={(val) => {
                                                        if (val) form.mutators.onBrandChange(false)
                                                    }}
                                                    wrapperStyle={{ marginTop:"5px" }} type="checkbox" name="no_brand">This product does not have a brand name</FormField>
                                                </Col>

                                                <Col span={8} align="right"><Label>Barcode</Label></Col>
                                                <Col span={16}>
                                                    <FormField type="text" name="barcode" disabled={values.no_barcode} required={!values.no_barcode}
                                                        validate={(value, allValues) => !allValues.no_barcode ? rules.required(value) : undefined}
                                                    />
                                                    <FormField wrapperStyle={{ marginTop: "5px" }} type="checkbox" name="no_barcode">{escapeText("I don't have a product barcode")}</FormField>
                                                </Col>

                                            </Row>
                                        </div>}

                                        {activeStep == 2 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Vital Info</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label style={{ margin: 0 }}>Is product expirable?</Label></Col>
                                                <Col span={16}><FormField checkedChildren="Yes" unCheckedChildren="No" type="switch" name="is_expirable" /></Col>

                                                <Col span={8} align="right"><Label>Country/Regin or Origin</Label></Col>
                                                <Col span={16}><FormField type="text" name="origon" validate={rules.required} /></Col>

                                                <Col span={8} align="right"><Label style={{ marginTop:"22px" }}>Attributes</Label></Col>
                                                <Col span={16}>
                                                    <FieldArray name="attribute">
                                                        {({ fields }) => {
                                                            return (<>
                                                                <Space direction='vertical' size={10}>
                                                                    {fields.map((name, index) => {
                                                                        const thisNode = fields.value[index];

                                                                        return (<Space key={index}>
                                                                            <ProdAttributeDD label="Attribute" name={`${name}._id`} preload validate={rules.required} wrapperStyle={{ minWidth: "200px" }}
                                                                                onChange={(val, raw) => {
                                                                                    form.mutators.onAttributeTypeChange(raw, values.attribute, index)
                                                                                }}
                                                                            />
                                                                            <FormField label="Value" type="text" name={`${name}.val`} validate={rules.required} />

                                                                            {/* <div style={{ paddingTop:"15px" }}><DeleteButton onClick={() => fields.remove(index)} size="small" /></div> */}
                                                                            <div style={{ paddingTop:"15px" }}><IconButton onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></div>
                                                                        </Space>)

                                                                    })}
                                                                    
                                                                    <div align="center" style={{ padding:"10px" }}><Button type="dashed" onClick={() => fields.push({})} icon={<Icon icon="plus" />}>Add Attribute</Button></div>
                                                                </Space>
                                                            </>)
                                                        }}
                                                    </FieldArray>
                                                </Col>

                                                <Col span={8} align="right"><Label style={{ margin: 0 }}>Is this item temperature sensitive?</Label></Col>
                                                <Col span={16}>
                                                    <FormField checkedChildren="Yes" unCheckedChildren="No" type="switch" name="is_temp_sensitive" />
                                                </Col>

                                                <Col span={8} align="right"><Label>Product Type</Label></Col>
                                                <Col span={16}><ProdTypeDD name="type._id" validate={rules.required} preload onChange={form.mutators.onTypeChange} /></Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 3 && <div style={{ border: "0px solid red" }}>
                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={24}><Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Limits</Divider></Col>
                                                <Col span={6}><FormField label="Cart limit" type="number" name="cart_limit" validate={rules.required} /></Col>

                                                <Col span={6} align="right"><Label>Stock level</Label></Col>
                                                <Col span={6}><FormField label="Min" type="number" name="stock_level.min" validate={rules.required} /></Col>
                                                <Col span={6}><FormField label="Max" type="number" name="stock_level.max" validate={rules.required} /></Col>

                                                <Col span={24}><Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Cost & Price</Divider></Col>
                                                <Col span={8}><FormField label="Cost" type="number" name="cost" validate={rules.required} /></Col>
                                                
                                                <Col span={24}><Divider>Tax Settings</Divider></Col>
                                                <Col span={8} align="right"><Label style={{ marginTop: "0px" }}>This product is texable</Label></Col>
                                                <Col span={16}><FormField checkedChildren="Yes" unCheckedChildren="No" type="switch" name="tax.texable" /></Col>

                                                {values?.tax?.texable && <>
                                                    <Col span={8} align="right" />
                                                    <Col span={10}><FormField type="text" label="HS Code" name="tax.hs_code" validate={rules.required} /></Col>
                                                    <Col span={6}><FormField options={tax_applition_on} type="select" label="Tax amount to be applied at" name="tax.applied_at" validate={rules.required} /></Col>
                                                </>}

                                                {values?.tax?.texable && <>
                                                    <Col span={8} align="right" />
                                                    <Col span={16}><Space size={5}>
                                                        <FormField wrapperStyle={{ width: '80px' }} options={tax_formula_types} type="select" label="Tax Formula" compact name="tax.formula" onChange={(e) => form.mutators.calculateTotalTax({ formula: e, amount: values?.tax?.amount, price: values?.price })} />
                                                        <FormField wrapperStyle={{ width: '80px' }} type="number" label="Amount" name="tax.amount" compact min={0} onChange={(e) => form.mutators.calculateTotalTax({ formula: values?.tax?.formula, amount: e, price: values?.price })} />
                                                        <FormField prefix={<span>= </span>} wrapperStyle={{ width: '80px', marginLeft:"10px" }} type="text" name="suffix_tax_total" disabled label="&nbsp;" />
                                                    </Space></Col>
                                                </>}
                                                
                                            </Row>
                                        </div>}

                                        {activeStep == 4 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Product Details</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label>Product description</Label></Col>
                                                <Col span={16}>
                                                    <FieldArray name="description">
                                                        {({ fields }) => {
                                                            return (<>
                                                                {fields.map((name, index) => {
                                                                    const thisNode = fields.value[index];

                                                                    return (<div key={index} style={{ marginBottom:"10px" }}>
                                                                        <Row>
                                                                            <Col flex="auto"><FormField type="textarea" rows={2} name={name} validate={rules.required} /></Col>
                                                                            <Col><IconButton onClick={()=>fields.remove(index)} type="danger" icon="trash-alt" /></Col>
                                                                        </Row>
                                                                    </div>)

                                                                })}
                                                                <div align="center" style={{ padding: "10px" }}>
                                                                    <Button type="dashed" onClick={() => fields.push("")} icon={<Icon icon="plus" />}>Add {values?.description?.length > 0 ? "More" : "Description"}</Button>
                                                                </div>
                                                            </>)
                                                        }}
                                                    </FieldArray>
                                                </Col>

                                                <Col span={8} align="right"><Label>Bullit points</Label></Col>
                                                <Col span={16}>
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
                                                                <div align="center" style={{ padding: "10px" }}>
                                                                    <Button type="dashed" onClick={() => fields.push("")} icon={<Icon icon="plus" />}>Add {values?.bullits?.length > 0 ? "More" : "Bullit"}</Button>
                                                                </div>
                                                                {/* {values?.bullits?.length > 0 ? <span className='a' onClick={() => fields.push("")}>Add more</span> : <Button onClick={() => fields.push("")}>Add Bullit</Button>} */}
                                                            </>)
                                                        }}
                                                    </FieldArray>
                                                </Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 5 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Images</Divider>

                                            <Row gutter={[10, 10]}>
                                                {/* {new Array(8).fill({}).map((item, i) => (<Col key={i} span={6}><p>Image</p></Col>))} */}
                                                <Col span={6} align="center">
                                                    <FileUploader 
                                                        name="picture"
                                                        thumbnail={{ displaySize: { width: "190px", height: "190px" } }}
                                                        maxCount={1}
                                                        multiple={false}
                                                        debounceTime={100}
                                                        // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}`}]}
                                                        // uploadFiles={uploadProdImage}
                                                        // deleteFile={onProdImageDelete}
                                                        onUpdateFiles={form.mutators.onUpdateMainFile}
                                                    />
                                                    <div align="center">MAIN</div>
                                                </Col>
                                                <Col span={6} align="center">
                                                    <FileUploader
                                                        name="video"
                                                        icon="video"
                                                        accept=".mp4"
                                                        thumbnail={{ displaySize: { width: "190px", height: "190px" } }}
                                                        maxCount={1}
                                                        multiple={false}
                                                        debounceTime={100}
                                                        // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}` }]}
                                                        // uploadFiles={uploadProdImage}
                                                        // deleteFile={onProdImageDelete}
                                                        onUpdateFiles={form.mutators.onUpdateVideoFile}
                                                    />
                                                    <div align="center">VIDEO</div>
                                                </Col>
                                                {/* <Col span={24}>
                                                    <FileUploader
                                                        name={name}
                                                        thumbnail={{ displaySize: { width: "190px", height: "190px" } }}
                                                        maxCount={6}
                                                        multiple={false}
                                                        debounceTime={100}
                                                        // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}` }]}
                                                        // uploadFiles={uploadProdImage}
                                                        // deleteFile={onProdImageDelete}
                                                        onUpdateFiles={form.mutators.onUpdateGalleryFiles}
                                                    />
                                                </Col> */}

                                                <FieldArray name="gallery">
                                                    {({ fields }) => {
                                                        return (<>
                                                            {fields.map((name, index) => {
                                                                const thisNode = fields.value[index];

                                                                return (<Col key={index} span={6} align="center">
                                                                    <FileUploader
                                                                        name={name}
                                                                        thumbnail={{ displaySize: { width: "190px", height: "190px" } }}
                                                                        maxCount={1}
                                                                        multiple={false}
                                                                        debounceTime={100}
                                                                        defaultValues={(thisNode && thisNode.uid) ? [thisNode] : []}
                                                                        // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}` }]}
                                                                        // uploadFiles={uploadProdImage}
                                                                        // deleteFile={onProdImageDelete}
                                                                        onUpdateFiles={form.mutators.onUpdateGalleryFiles}
                                                                    />
                                                                </Col>)

                                                            })}
                                                        </>)
                                                    }}
                                                </FieldArray>


                                                {/* {imagePreset.map((item, i) => {
                                                    return (<Col key={i} span={6} align="center">
                                                        <FileUploader
                                                            name="picture"
                                                            thumbnail={{ displaySize: { width: "190px", height: "190px" } }}
                                                            maxCount={1}
                                                            multiple={true}
                                                            // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${process.env.NEXT_PUBLIC_ASSETS_API}${values?.picture?.url}`, thumb: `${process.env.NEXT_PUBLIC_ASSETS_API}${values?.picture?.thumb}`}]}
                                                            defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}` }]}
                                                            uploadFiles={uploadProdImage}
                                                            deleteFile={onProdImageDelete}
                                                        />
                                                    </Col>)
                                                })} */}
                                            </Row>
                                        </div>}

                                        {activeStep == 6 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Shopping</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label style={{ marginTop: 0 }}>Is this unfit for dispatch box?</Label></Col>
                                                <Col span={16}><FormField checkedChildren="Yes" unCheckedChildren="No" type="switch" name="fit_for_dispatch" /></Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 7 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Keywords</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label style={{ marginTop: "3px" }}>Tags for local search</Label></Col>
                                                <Col span={16}><TagsManager name="tags" /></Col>

                                                <Col span={24}><Divider>SEO Data</Divider></Col>
                                                
                                                <Col span={8} align="right"><Label>Keywords</Label></Col>
                                                <Col span={16}><FormField type="text" name="meta.keywords" /></Col>

                                                <Col span={8} align="right"><Label>Title</Label></Col>
                                                <Col span={16}><FormField type="text" name="meta.title" /></Col>

                                                <Col span={8} align="right"><Label>Description</Label></Col>
                                                <Col span={16}><FormField type="text" name="meta.description" /></Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 8 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Status</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label>Product Status</Label></Col>
                                                <Col span={16}><FormField options={publishStatus} type="select" name="status" validate={rules.required} /></Col>
                                            </Row>
                                        </div>}

                                    </div>
                                </div>


                                <div style={{ borderTop: "1px solid #DDD", position: "absolute", bottom: 0, left: 0, width: "calc(100vw - 15px)", position: "fixed", padding:"10px", backgroundColor:"#EEEE" }}>
                                    <Row gutter={[10, 10]}>
                                        <Col span={12} align="left">
                                            <Popconfirm
                                                title="Exit product"
                                                description="Are you sure to exit without saving your progress?"
                                                onConfirm={() => router.back()}
                                                onCancel={console.log}
                                                okText="Yes"
                                                cancelText="No"
                                            >
                                                <Button color="red">Exit</Button>
                                            </Popconfirm>
                                        </Col>
                                        <Col span={12} align="right">
                                            <Space size={50}>
                                                <Button onClick={() => set_activeStep(activeStep - 1)} disabled={activeStep==0}>Back</Button>
                                                <SubmitButton label={activeStep == 7 ? "Save" : "Next"} loading={submitting} />
                                            </Space>
                                        </Col>
                                    </Row>
                                </div>

                            </Col>
                        </Row>

                    </form>

                    <DevBlock obj={values} title='values' />
                    <div style={{ height:"50px" }} />
                </>)

            }}
        />

    </>)
}

export default function CreateProductFormWrapper (props) {
    let initialValues = props.initialValues || defaultValues;
    return <CreateProductForm {...props} initialValues={initialValues} />
}