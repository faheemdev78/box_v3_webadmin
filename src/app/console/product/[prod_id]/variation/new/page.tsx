'use client'

import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { Barcode, ProdCatTreeSelection, BarcodeScanner, Button, Icopn, DevBlock, Loader, FileUploader, IconButton, Icon } from '@_/components';
import { BrandsDD, ProdAttributeDD, ProdTypeDD } from '@_/components/dropdowns';
import { message, Row, Col, Drawer, Card, Divider, Alert, Space, Steps, Popconfirm, Tag, Input, Flex, Tooltip, theme } from 'antd';
import { adminRoot, publishStatus, tax_applition_on, tax_formula_types } from '@_/configs';
import { checkApolloRequestErrors, escapeText, sleep, string_to_slug, uploadFile, uploadFiles } from '@_/lib/utill';
import { __blue, __error, __yellow } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm, FormSpy } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, submitHandler, Label as FormLabel, TagsManager } from '@_/components/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductWrapper from '@_/modules/products/productWrapper';
import { debounce } from 'lodash'; // Import debounce from lodash


import RECORD_ADD from '@_/graphql/product/addProductVarient.graphql'
import RECORD_EDIT from '@_/graphql/product/editProductVarient.graphql'

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));
const Label = ({ children, style }) => (<FormLabel style={{ marginTop: "7px", ...style }}>{children}</FormLabel>)

const imagePreset = [
    // { type: "image", cat:"main" },
    // { type: "video", cat: "gallery" },
    {},
    {},
    {},
    {},
    {},
    {},
]

const stepsArray = [
    { title: 'Product Category' },
    { title: 'Product Identity' },
    { title: 'Vital Info' },
    { title: 'Limits & Tax' },
    { title: 'Product Details' },
    { title: 'Shopping' },
    { title: 'Keywords' },
]

const defaultValues = {
    gallery: imagePreset,
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

const SpyWrapper = ({ values, debouncedSetFormValues }) => {
    useEffect(() => {
        debouncedSetFormValues(values);
    }, [values])

    return null;
}

function ProdVariationForm({ initialValues }) {
    // console.log(__blue("ProdVariationForm()"), initialValues)
    const [formValues, setFormValues] = useState(initialValues);
    const [error, setError] = useState(null)
    const [activeStep, set_activeStep] = useState(0)
    const formRef = useRef();
    const router = useRouter()

    // Create a debounced function using useRef
    const debouncedSetFormValues = useRef(
        debounce((newValues) => {
            setFormValues(newValues); // Safely update the state
        }, 300) // Adjust delay as needed
    ).current;

    useEffect(() => {
        // Cleanup debounced function on unmount
        return () => {
            debouncedSetFormValues.cancel();
        };
    }, [debouncedSetFormValues]);


    const [addProductVarient, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [editProductVarient, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    const onSubmit = async (values) => {
        setError(null)

        if (activeStep < stepsArray.length) {
            set_activeStep(activeStep + 1)
            return false;
        }

        let input = {
            _id_parent: initialValues._id_parent,
            title: values.title,
            slug: values.slug,
            no_barcode: (values.no_barcode === true),
            barcode: values.barcode,
            is_expirable: (values.is_expirable === true),
            attributes: !values.attributes ? undefined : values.attributes.map(item => ({
                _id: item._id,
                val: item.val,
                title: item.title,
                slug: item.slug,
                code: item.code,
            })),
            is_temp_sensitive: (values.is_temp_sensitive === true),
            type: !values.type ? undefined : { _id: values.type._id, title: values.type.title, slug: values.type.slug },
            status: values.status || "draft",
            cart_limit: Number(values.cart_limit || 0),
            stock_level: { min: Number(values?.stock_level?.min || 0), max: Number(values?.stock_level?.max || 0) },
            cost: Number(values.cost || 0),
            tax: {
                texable: (values?.tax?.texable === true),
                formula: values?.tax?.formula,
                amount: Number(values?.tax?.amount || 0),
                hs_code: values?.tax?.hs_code,
                applied_at: values?.tax?.applied_at
            },
            description: values.description,
            bullits: values.bullits,
            fit_for_dispatch: (values.fit_for_dispatch === true),
            tags: values?.tags?.join(), //?.toString(),
            // meta: [
            //     { name: 'keywords', val: values?.meta?.keywords },  //values?.meta?.keywords?.toString() },
            //     { name: 'title', val: values?.meta?.title },
            //     { name: 'description', val: values?.meta?.description },
            // ],
        }

        let meta = [];
        Object.keys(values?.meta).forEach(key => meta.push({ name: key, val: values?.meta && values?.meta[key] }));
        Object.assign(input, { meta })

        var results;
        if (initialValues && initialValues._id){
            Object.assign(input, { _id: initialValues._id })
            results = await _editProductVarient(input);
        }
        else{
            results = await _addProductVarient(input);
        }

        if (results.error) {
            message.error(results.error.message)
            setError(results.error.message)
            return false;
        }

        onSuccess(results);

        message.success("Success");
        return false;
    }

    const onSuccess = (results) => router.push(`${adminRoot}/product/${results._id_parent}/view`);

    const _addProductVarient = async (input) => {
        let results = await addProductVarient({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.addProductVarient }))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Request Error!" } }
            })

        return results;
    }

    const _editProductVarient = async (input) => {
        let results = await editProductVarient({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.editProductVarient }))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Request Error!" } }
            })

        return results;
    }


    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={formValues} subscription={{ submitting: true, pristine: true, values: true }}
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

                    tools.changeValue(state, 'attributes', () => values)
                },
                calculateTotalTax: (newValueArray, state, tools) => {
                    let { amount, formula, price } = newValueArray[0];

                    if (!amount || amount < 1 || !formula || !price || price < 1) tools.changeValue(state, 'suffix_tax_total', () => undefined)
                    else if (formula == 'fix') tools.changeValue(state, 'suffix_tax_total', () => amount)
                    else if (formula == 'percent') tools.changeValue(state, 'suffix_tax_total', () => Number((price / 100) * amount).toFixed(2))
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;
                formRef.current = form;

                return (<>
                    <form id="CreateProductVariationsForm" {...submitHandler(formargs)} style={{ border: "0px solid black", minHeight: "100%" }}>

                        {/* Update local state with current form values, this will preserve values and will not reset back to initialValues */}
                        <FormSpy subscription={{ values: true }}>
                            {({ values }) => {
                                return <SpyWrapper debouncedSetFormValues={debouncedSetFormValues} values={values} />
                            }}
                        </FormSpy>

                        <Row className='nowrap' style={{ border: "0px solid black", minHeight: "100%" }}>
                            <Col flex="300px">
                                <p>Picture</p>
                                <p>Title</p>
                                <p>Barcode</p>
                                <p>Categories</p>
                                <p>Attributes filter</p>
                            </Col>
                            <Col flex="auto" style={{ backgroundColor: "#FFF" }}>
                                <h2>Variation <span style={{ color: "#999" }}>of <Link href={`${adminRoot}/product/${initialValues._id_parent}/view`}>{initialValues.title}</Link></span></h2>

                                {error && <Alert message={error} showIcon type='error' />}

                                <div style={{ padding: "20px 100px 50px 100px" }}><Steps progressDot current={activeStep} items={stepsArray} /></div>

                                <div align="center">
                                    <div style={{ width: "800px", textAlign: "left", padding: "0 0 50px 0" }}>

                                        {activeStep == 0 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Select a product category</Divider>

                                            <Row gutter={[0, 20]}>
                                                <Col span={24}>
                                                    <ProdCatTreeSelection name="categories" onChange={form.mutators.onCatChange} validate={rules.required} />
                                                    {/* <FormField type="hidden" name="categories" validate={rules.required} /> */}
                                                </Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 1 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Product Identity</Divider>

                                            <Row gutter={[10, 20]} align="top">
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
                                                        wrapperStyle={{ marginTop: "5px" }} type="checkbox" name="no_brand">This product does not have a brand name</FormField>
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
                                                    <FieldArray name="attributes">
                                                        {({ fields }) => {
                                                            return (<>
                                                                <Space direction='vertical' size={10}>
                                                                    {fields.map((name, index) => {
                                                                        const thisNode = fields.value[index];

                                                                        return (<Space key={index}>
                                                                            <ProdAttributeDD label="Attributes" name={`${name}._id`} preload validate={rules.required} wrapperStyle={{ minWidth: "200px" }}
                                                                                onChange={(val, raw) => {
                                                                                    form.mutators.onAttributeTypeChange(raw, values.attributes, index)
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
                                                <Col span={6} align="right"><Label>Cart limit</Label></Col>
                                                <Col span={6}><FormField type="number" name="cart_limit" validate={rules.required} /></Col>
                                                
                                                <Col span={6} align="right"><Label>Cart limit</Label></Col>
                                                <Col span={6}><Space>
                                                    <FormField prefix={<Label style={{margin:0}}>Min</Label>} type="number" name="stock_level.min" validate={rules.required} />
                                                    <FormField prefix={<Label style={{ margin: 0 }}>Max</Label>} type="number" name="stock_level.max" validate={rules.required} />
                                                </Space></Col>

                                                <Col span={24}><Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Cost</Divider></Col>
                                                <Col span={8} align="center"><FormField label="Cost" direction="horizontal" type="number" name="cost" validate={rules.required} /></Col>

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
                                                        {/* <FormField prefix={<span>= </span>} wrapperStyle={{ width: '80px', marginLeft: "10px" }} type="text" name="suffix_tax_total" disabled label="&nbsp;" /> */}
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

                                                                    return (<div key={index} style={{ marginBottom: "10px" }}>
                                                                        <Row>
                                                                            <Col flex="auto"><FormField type="textarea" rows={2} name={name} validate={rules.required} /></Col>
                                                                            <Col><IconButton onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></Col>
                                                                        </Row>
                                                                    </div>)

                                                                })}
                                                                {/* {values?.description?.length > 0 ? <span className='a' onClick={() => fields.push("")}>Add more</span> : <Button onClick={() => fields.push("")}>Add Description</Button>} */}
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
                                                                {/* {values?.bullits?.length > 0 ? <span className='a' onClick={() => fields.push("")}>Add more</span> : <Button onClick={() => fields.push("")}>Add Bullit</Button>} */}
                                                                <div align="center" style={{ padding: "10px" }}>
                                                                    <Button type="dashed" onClick={() => fields.push("")} icon={<Icon icon="plus" />}>Add {values?.bullits?.length > 0 ? "More" : "Bullit"}</Button>
                                                                </div>
                                                            </>)
                                                        }}
                                                    </FieldArray>
                                                </Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 5 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Shopping</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label style={{ marginTop: 0 }}>Is this unfit for dispatch box?</Label></Col>
                                                <Col span={16}><FormField checkedChildren="Yes" unCheckedChildren="No" type="switch" name="fit_for_dispatch" /></Col>
                                            </Row>
                                        </div>}

                                        {activeStep == 6 && <div style={{ border: "0px solid red" }}>
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

                                        {activeStep == 7 && <div style={{ border: "0px solid red" }}>
                                            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Status</Divider>

                                            <Row gutter={[10, 20]} align="top">
                                                <Col span={8} align="right"><Label>Product Status</Label></Col>
                                                <Col span={16}><FormField options={publishStatus} type="select" name="status" validate={rules.required} /></Col>
                                            </Row>
                                        </div>}

                                    </div>
                                </div>


                                <div style={{ borderTop: "1px solid #DDD", position: "absolute", bottom: 0, left: 0, width: "calc(100vw - 15px)", position: "fixed", padding: "10px", backgroundColor: "#EEEE" }}>
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
                                                <Button onClick={() => set_activeStep(activeStep - 1)} disabled={activeStep == 0}>Back</Button>
                                                <SubmitButton label={activeStep == 7 ? "Save" : "Next"} loading={submitting} />
                                            </Space>
                                        </Col>
                                    </Row>
                                </div>

                            </Col>
                        </Row>

                    </form>

                    <DevBlock obj={values} title='values' />
                    
                    <div style={{ height: "60px" }} />
                </>)

            }}
        />

    </>)
}

export default function ProdVariationFormWrapper(props){
    return (<ProductWrapper {...props} render={({ product }) => {
        let initialValues = {
            ...product,
            _id_parent: product._id,
            _id: undefined,
            barcode: undefined,
            variations_count: undefined,
            variations: undefined,
            slug: undefined,
            published_at: undefined,
            // createdAt: undefined,
            // updatedAt: undefined,
            already_in_alert: undefined,
            tags: (product?.tags && product?.tags?.split(",")) || [],
        }

        let meta = product.meta ? product.meta.slice() : [];
        let _meta = {};
        meta.forEach(key => {
            Object.assign(_meta, {
                [key.name]: key.val
            })
        })
        Object.assign(initialValues, { meta: _meta })
        
        return (<ProdVariationForm initialValues={initialValues} {...props} />)
    }} />)
}
