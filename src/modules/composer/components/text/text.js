'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './Text.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';
import { Card, Col, Row, Space } from 'antd';
import { Heading } from '../../typography';

export function Text_Render({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)
    return (<>
        <div className={cssStyles.comp_text} style={style}>{(values && values.value) || <span style={{ color: "#999" }}>Empty Text</span>}</div>
    </>)
}

export function Text_Props({ item: { name, data, values } }){
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
    type: "text", 
    label: "Text", 
    desc: "Simple text",
    renderer: Text_Render, 
    propsRender: Text_Props
}

