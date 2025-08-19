'use client'
import React, { useState } from 'react'
import { Alert, Col, Row, Space } from 'antd';
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { DevBlock } from '@_/components';
import { string_to_slug } from '@_/lib/utill';
import { ComponentStyling } from './lib';


export function PageSettings({ onUpdate, data }) {
    const [error, setError] = useState(null)

    const onSubmit = async (values) => {
        onUpdate(values)
        return false;
    }

    return (<div align="center">
        <h1>{`Creating "${data?.page_type?.title}" Variant`}</h1>
        <p>Please fill in the details below</p>

        <div style={{ backgroundColor: "#FFF", border: "1px solid #89A3BE", position: "relative", padding: "20px", display: "inline-block" }} align="left">
            <FinalForm onSubmit={onSubmit} initialValues={data}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="component_creator_form" {...submitHandler(formargs)}><Row gutter={[10, 10]}>

                            <Row gutter={[20, 20]}>
                                <Col span={12}>
                                    <h4>Page Info</h4>
                                    <FormField name="title" label="Page Title" type="text" validate={rules.required} />
                                    <FormField name="slug" label="Page Slug" type="text" placeholder={'section1/section2/section3'}
                                        onChange={(e, callback) => callback(string_to_slug(e.target.value, "/"))}
                                        validate={rules.required} />
                                    <FormField name="description" label="Page Description" rows={2} type="textarea" />
                                    <FormField name="p_limit" label="Pagination Limit" type="number" validate={rules.required} />
                                </Col>
                                <Col span={12}>
                                    <ComponentStyling showHeading={false} />

                                    {/* <h4>Background</h4>
                                    <Row gutter={[10, 10]} align="bottom">
                                        <Col span={10}>
                                            <FormField
                                                options={[
                                                    { title: "None", value: "none" },
                                                    { title: "Gradient", value: "gradient" },
                                                    { title: "Solid", value: "solid" },
                                                ]}
                                                name="background.type" label="Type" type="select" />
                                        </Col>
                                        <Col span={10}>
                                            {values?.background?.type !== 'none' && <>
                                                <FormField disabled={values?.background?.type !== 'gradient'}
                                                    options={[
                                                        { title: "Vertical", value: "vertical" },
                                                        { title: "Horizontal", value: "horizontal" },
                                                    ]}
                                                    name="background.direction" label="Direction" type="select" />
                                            </>}
                                        </Col>
                                        <Col span={4}>
                                            {values?.background?.type == 'gradient' && <Space direction='horizontal'>
                                                <FormField name="background.color1" _label="Color 1" type="color" compact />
                                                <FormField name="background.color2" _label="Color 2" type="color" compact />
                                            </Space>}

                                            {values?.background?.type == 'solid' && <div><FormField name="background.color1" _label="Color 1" type="color" compact /></div>}
                                        </Col>
                                        <Col span={24}>
                                            <FormField name="background.add_background" type="checkbox">Add Background Image</FormField>
                                            {values?.background?.add_background && <div>
                                                <div>Upload Image</div>
                                            </div>}
                                        </Col>
                                    </Row>

                                    <div style={{ height:"10px" }} />
                                    <h4>Spacing</h4>
                                    <Row gutter={[10]}>
                                        <Col span={6}><FormField name="spacing.top" label="Top" type="number" validate={rules.required} compact /></Col>
                                        <Col span={6}><FormField name="spacing.right" label="Right" type="number" validate={rules.required} compact /></Col>
                                        <Col span={6}><FormField name="spacing.bottom" label="Bottom" type="number" validate={rules.required} compact /></Col>
                                        <Col span={6}><FormField name="spacing.left" label="Left" type="number" validate={rules.required} compact /></Col>
                                    </Row> */}

                                </Col>
                            </Row>


                            {/* <Col span={24}><FormField name="title" label="title" type="text" validate={rules.required} /></Col>
                            <Col span={24}><FormField name="pwd" label="Password" type="password" validate={rules.required} /></Col> */}
                            <Col span={24} align="center"><SubmitButton loading={submitting} disabled={invalid} color="orange" label="Next" /></Col>

                        </Row></form>

                        <DevBlock obj={values} />
                    </>)

                }}
            />
        </div>
    </div>)
}
