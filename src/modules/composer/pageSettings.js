'use client'
import React, { useState } from 'react'
import { Alert, Col, Divider, Row, Space, Card, Tag } from 'antd';
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import arrayMutators from 'final-form-arrays'
import { DevBlock } from '@/components';
import { normalizePageSlug } from './pageSlug';
import { ComponentStyling } from './lib';
import { BrandsDD, ProdCatsDD, ManufacturersDD } from '@/components/dropdowns';


function PageSettingsForm({ onUpdate, initialValues }) {
    const [error, setError] = useState(null)

    const onSubmit = async (values) => {
        setError(null);
        await onUpdate({ ...values, slug: normalizePageSlug(values.slug) }).then(r=>{
            if (r.error) setError(r.error.message)
        })
        return false;
    }

    return (<div align="center">
        <h2>{`Creating "${initialValues?.page_type?.title}" Variant`}</h2>
        <p>Please fill in the details below</p>

        <div style={{ backgroundColor: "#FFF", border: "0px solid #89A3BE", position: "relative", padding: "20px", display: "inline-block" }} align="left">
            <Card>
                <FinalForm onSubmit={onSubmit} initialValues={initialValues}
                    mutators={{
                        // ...arrayMutators,
                        selectSource: (newValueArray, state, tools) => {
                            let raw = newValueArray[0];

                            let val = {
                                _id: raw._id,
                                title: raw.title,
                                path: normalizePageSlug(raw.path)
                            }
                            
                            tools.changeValue(state, 'page_source', () => val)
                            tools.changeValue(state, 'slug', () => val.path)
                        },
                    }}
                    render={(formargs) => {
                        const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                        let sourceField;
                        switch (values.page_type.type) {

                            case "category_page":
                            case "store_page":
                            case "category_detail_page":
                                sourceField = <>
                                    <ProdCatsDD
                                        preload
                                        key={values.page_type.type}
                                        static_filter={values.page_type.type === 'category_detail_page' ? { category_level: 2 } : {}}
                                        name="page_source._id" label="Category" validate={rules.required}
                                        onChange={(val, raw, callback) => {
                                            form.mutators.selectSource({
                                                _id: raw._id,
                                                title: raw.title,
                                                path: raw.cat_path
                                            });
                                            // callback(raw._id)
                                        }}
                                    />
                                    {values?.page_source?.path && <Tag>{values?.page_source?.path}</Tag>}
                                </>;
                                break;

                            case "brand_page":
                                sourceField = <>
                                    <BrandsDD
                                        preload
                                        name="page_source._id" label="Brand" validate={rules.required}
                                        onChange={(val, raw, callback) => {
                                            form.mutators.selectSource({
                                                _id: raw._id,
                                                title: raw.title,
                                                path: `/${raw.slug}`
                                            });
                                            // callback(raw._id)
                                        }}
                                    />
                                    {values?.page_source?.path && <Tag>{values?.page_source?.path}</Tag>}
                                </>;
                                break;

                            case "manufacturer_page":
                                sourceField = <>
                                    <ManufacturersDD
                                        preload
                                        name="page_source._id" label="Manufacturer" validate={rules.required}
                                        onChange={(val, raw) => {
                                            form.mutators.selectSource({
                                                _id: raw._id,
                                                title: raw.title,
                                                path: `/${raw.slug}`
                                            });
                                        }}
                                    />
                                    {values?.page_source?.path && <Tag>{values.page_source.path}</Tag>}
                                </>;
                                break;

                            default:
                                sourceField = null;
                        }

                        return (<>
                            {error && <Alert title="Error" description={error} showIcon type='error' />}
                            <form id="component_creator_form" {...submitHandler(formargs)}><Row gutter={[10, 10]}>

                                <Row gutter={[20, 20]}>
                                    <Col span={12}>
                                        <Divider>Page Info</Divider>
                                        <FormField name="title" label="Page Title" type="text" validate={rules.required} />
                                        {/* <FormField name="slug" label="Page Slug" type="text" placeholder={'section1/section2/section3'}
                                            onChange={(e, callback) => callback(string_to_slug(e.target.value, "/"))}
                                            validate={rules.required} /> */}

                                        {sourceField}

                                        <FormField name="slug" label="Page Slug" type="text"
                                            disabled={['category_page', 'brand_page', 'manufacturer_page', 'store_page', 'category_detail_page'].includes(values.page_type.type)}
                                            fieldProps={{ onBlur: () => {
                                                form.change('slug', normalizePageSlug(values.slug));
                                                form.blur('slug');
                                            } }}
                                            onChange={(e, callback) => {
                                                const value = e.target.value.toLowerCase();
                                                callback(value ? `/${value.replace(/^\/+/, '')}` : '');
                                            }}
                                            validate={rules.required}
                                        />


                                        {/* {values.page_type.type === "category_page" && <>
                                            <ProdCatsDD 
                                                name="page_source._id" label="Category" validate={rules.required}
                                                onChange={(val, raw, callback) => {
                                                    form.mutators.selectSource({
                                                        _id: raw._id,
                                                        title: raw.title,
                                                        path: raw.cat_path
                                                    });
                                                    // callback(raw._id)
                                                }}
                                            />
                                            {values?.page_source?.path && <Tag>{values?.page_source?.path}</Tag>}
                                        </>}

                                        {values.page_type.type === "brand_page" && <>
                                            <BrandsDD 
                                                name="page_source._id" label="Brand" validate={rules.required}
                                                onChange={(val, raw, callback) => {
                                                    form.mutators.selectSource({
                                                        _id: raw._id,
                                                        title: raw.title,
                                                        path: `/${raw.slug}`
                                                    });
                                                    // callback(raw._id)
                                                }}
                                            />
                                            {values?.page_source?.path && <Tag>{values?.page_source?.path}</Tag>}
                                        </>} */}

                                        <FormField name="description" label="Page Description" rows={2} type="textarea" />


                                        <FormField name="p_limit" label="Pagination Limit" type="number" validate={rules.required} />
                                    </Col>
                                    <Col span={12}>
                                        {/* <ComponentStyling showHeading={false} /> */}
                                        {/* <FormField name={'statusbar_color'} type="color" label="Status Bar Color" /> */}
                                        <FormField name={'statusbar_color'} type="select" label="Status Bar Color"
                                            options={[
                                                { value: 'dark-content', label:'dark-content' },
                                                { value: 'light-content', label:'light-content' },
                                            ]}
                                        />
                                    </Col>
                                </Row>

                                <Col span={24} align="center"><SubmitButton style={{ margin:"20px" , width: "150px" }} loading={submitting} disabled={invalid} color="orange" label="Next" /></Col>

                            </Row></form>

                            <DevBlock obj={values} />
                        </>)

                    }}
                />
            </Card>
        </div>
    </div>)
}

export function PageSettings({ initialValues, ...props }){
    let _initialValues = { 
        styles: {
            padding: {
                top: 10, right: 10, bottom: 10, left: 10
            }
        },
        p_limit: 20,
        ...initialValues,
        slug: normalizePageSlug(initialValues?.slug)
    }
    return (<PageSettingsForm {...props} initialValues={_initialValues} />)
}
