'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import cssStyles from './Header.module.scss'
import { Card, Col, Divider, Row, Space } from 'antd';
import { Heading } from '../../typography';
import { ComponentStyling, parseStylesOutput } from '../../lib';

function TopBar(){
    return (<div>
        <Row>
            <Col flex='auto'>LOGO</Col>
            <Col>Avatar</Col>
        </Row>
    </div>)
}
function AddressBar(){
    return (<div>
        <Row>
            <Col>Your address here</Col>
            <Col>Down arrow</Col>
        </Row>
    </div>)
}
function SearchBar(){
    return (<div>
        <div>Search bar</div>
    </div>)
}
function CatBar(){
    return (<div>
        <Space>
            {[1, 2, 3, 4, 5].map((item:any, i:number) => {
                return (<div key={i}>Cat 1</div>)
            })}
        </Space>
    </div>)
}

function Header_Render({ item: { data, values, styles, name } }: { item: any }) {
    let style = parseStylesOutput(styles)
    console.log({ data, values, styles, name })

    return (<>
        <div className={cssStyles.comp_header} style={style}>
            {values ? values.value : <span style={{ color: "#999" }}>Empty Header</span>}
        </div>
    </>)
}

function Header_Props({ item: { name, data, values } }: { item: any }){
    return (<>
        <Space orientation='vertical'>
            <Card styles={{ body: { padding: "10px" } }}>
                <Heading style={{}}>Visual Elements</Heading>
                {/* <FormField name={`${name}.values.value`} type="text" /> */}
                <Row gutter={[10, 10]}>
                    <Col flex={'50%'}><FormField label='Top Bar' name={`${name}.values.top_bar`} type="switch" /></Col>
                    <Col flex={'50%'}><FormField label='Address bar' name={`${name}.values.address_bar`} type="switch" /></Col>
                    <Col flex={'50%'}><FormField label='Search bar' name={`${name}.values.search_bar`} type="switch" /></Col>
                    <Col flex={'50%'}><FormField label='Category bar' name={`${name}.values.cat_bar`} type="switch" /></Col>
                </Row>
                
            </Card>
            <ComponentStyling name={name} />
        </Space>
    </>)
}

const HeaderComponent = {
    type: "header",
    label: "Header Ui",
    desc: "App Heading Ui",
    renderer: Header_Render,
    propsRender: Header_Props,
    displayName: "HeaderComponent"
};

export default HeaderComponent;
