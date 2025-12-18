'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import cssStyles from './H3.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';
import { Card, Col, Row, Space } from 'antd';
import { Heading } from '../../typography';

function H3_Render({ item }: { item: { data: any, values: any, styles: any, name: any } }) {
    const { data, values, styles, name } = item;
    let style = parseStylesOutput(styles)
    return (<>
        <div className={cssStyles.comp_h3} style={style}>
            {values ? values.value : <span style={{ color: "#999" }}>Empty H3</span>}
        </div>
    </>)
}

function H3_Props({ item }: { item: { name: any, data: any, values: any } }){
    const { name, data, values } = item;
    return (<>
        <Space orientation='vertical'>
            <Card styles={{ body: { padding: "10px" } }}>
                <Heading style={undefined}>Value</Heading>
                <FormField name={`${name}.values.value`} type="text" />
            </Card>

            <ComponentStyling name={name} />

        </Space>
    </>)
}

const H3Component = {
    type: "h3",
    label: "Heading 3",
    desc: "Heading three",
    renderer: H3_Render,
    propsRender: H3_Props,
    displayName: "H3Component"
};

export default H3Component;
