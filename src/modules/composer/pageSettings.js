'use client'
import React, { useState } from 'react'
import { Alert, Col, Divider, Row, Space, Card } from 'antd';
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import { DevBlock } from '@/components';
import { string_to_slug } from '@/lib/utill';
import { ComponentStyling } from './lib';


function PageSettingsForm({ onUpdate, initialValues }) {
    const [error, setError] = useState(null)

    const onSubmit = async (values) => {
        setError(null);
        await onUpdate(values).then(r=>{
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
                    render={(formargs) => {
                        const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                        return (<>
                            {error && <Alert title="Error" description={error} showIcon type='error' />}
                            <form id="component_creator_form" {...submitHandler(formargs)}><Row gutter={[10, 10]}>

                                <Row gutter={[20, 20]}>
                                    <Col span={12}>
                                        <Divider>Page Info</Divider>
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
                                                {values?.background?.type == 'gradient' && <Space orientation='horizontal'>
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
        ...initialValues
    }
    return (<PageSettingsForm {...props} initialValues={_initialValues} />)
}
