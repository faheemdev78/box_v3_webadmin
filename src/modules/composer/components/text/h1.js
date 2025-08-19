'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './H1.module.scss'
import { Card, Col, Divider, Row, Space } from 'antd';
import { Heading } from '../../typography';
import { ComponentStyling, parseStylesOutput } from '../../lib';

function H1_Render({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.comp_h1} style={style}>{(values && values.value) || <span style={{ color: "#999" }}>Empty H1</span>}</div>
    </>)
}

function H1_Props({ item: { name, data, values } }){
    return (<>
        <Space direction='vertical'>
            <Card styles={{ body: { padding: "10px" } }}>
                <Heading>Value</Heading>
                <FormField name={`${name}.values.value`} type="text" />
            </Card>

            <ComponentStyling name={name} />

        </Space>
    </>)
}

export default { 
    type: "h1", 
    label: "Heading 1", 
    desc: "Heading one",
    renderer: H1_Render, 
    propsRender: H1_Props
}