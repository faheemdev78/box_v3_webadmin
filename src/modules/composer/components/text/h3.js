'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './H3.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';
import { Card, Col, Row, Space } from 'antd';
import { Heading } from '../../typography';

function H3_Render({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)
    return (<>
        <div className={cssStyles.comp_h3} style={style}>{(values && values.value) || <span style={{ color: "#999" }}>Empty H3</span>}</div>
    </>)
}

function H3_Props({ item: { name, data, values } }){
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
    type: "h3", 
    label: "Heading 3", 
    desc: "Heading three",
    renderer: H3_Render, 
    propsRender: H3_Props
}
