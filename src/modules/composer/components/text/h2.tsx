'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './H2.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';
import { Card, Col, Row, Space } from 'antd';
import { Heading } from '../../typography';

function H2_Render({ item }: { item: { data: any, values: any, styles: any, name: any } }) {
    const { data, values, styles, name } = item;
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.comp_h2} style={style}>
            {values ? values.value : <span style={{ color: "#999" }}>Empty H2</span>}
        </div>
    </>)
}

function H2_Props({ item }: { item: { name: any, data: any, values: any } }){
    const { name, data, values } = item;
    return (<>
        <Space direction='vertical'>
            <Card styles={{ body: { padding: "10px" } }}>
                <Heading style={undefined}>Value</Heading>
                <FormField name={`${name}.values.value`} type="text" />
            </Card>

            <ComponentStyling name={name} />

        </Space>
    </>)
}

const H2Component = {
    type: "h2",
    label: "Heading 2",
    desc: "Heading two",
    renderer: H2_Render,
    propsRender: H2_Props,
    displayName: "H2Component"
};

export default H2Component;