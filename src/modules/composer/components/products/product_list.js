'use client'

import React, { useEffect, useState } from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { Alert, Card, Col, ColorPicker, Divider, Modal, Row, Skeleton, Space } from 'antd';
import { Heading } from '../../typography';
import { useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import { useMutation, useLazyQuery } from '@apollo/client';
import { ProductListSelector } from '@_/modules/products/components';
import cssStyles from './productList.module.scss'
import { ComponentSchedule, ComponentStyling, parseStylesOutput } from '../../lib';
import { Image, Avatar, Button, Icon, Loader, ProdSkeleton_ListItem } from '@_/components';
import { publishStatus } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';


import LIST_DATA from '@_/graphql/product/productsQuery.graphql'
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

function ProductList({ onProductsLoad, item: { data, schedule_start, schedule_end, values, sort_order, styles, status, name } }) {
    const [productsArray, set_productsArray] = useState(null);
    const [busy, setBusy] = useState(false);

    const [productsQuery, { data: __data, called, loading }] = useLazyQuery(LIST_DATA,
        { variables: { filter: JSON.stringify({}) } }
    );
    
    // useEffect(() => {
    //     if (called || !values || !values.products || values?.products?.length < 1) return;
    //     fetchProducts();
    // }, [values, called])

    const fetchProducts = async() => {
        setBusy(true);
        let ids = values.products.map(o=>(o._id))
        let filter = { _id: { $in: ids }}

        // await sleep(2000)
        const resutls = await productsQuery({
            variables: {
                limit: 20,
                page: 1,
                filter: JSON.stringify(filter),
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.productsQuery }))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Invalid response!" } }
            })

        setBusy(false);
        if (resutls || resutls?.edges?.length>0) {
            if (onProductsLoad) onProductsLoad(resutls.edges)
            set_productsArray(resutls.edges);
        }
    }

    let style = parseStylesOutput(styles)
    if (status == 'offline') Object.assign(style, { opacity: 0.5 })

    const { all_btn, num_products, theme, products } = values || {};
    const _num_products = Number(num_products || 3);

    let isScheduled = (schedule_start || schedule_end)

    let itemsArray = products || new Array(_num_products).fill({})

    return (<>
        {/* <div className={styles.comp_prod_list}>{values || <span style={{ color: "#999" }}>Empty ProductList</span>}</div> */}
        <div className={cssStyles.comp_prod_list} style={style}>
            <div className={cssStyles.feature_icons}><Space direction='vertical' size={2}>
                {isScheduled && <Icon icon="clock" />}
            </Space></div>
            
            {values?.title?.show && <h2>{values.title.text}</h2>}

            <ProdSkeleton_ListItem loading={busy} count={3} gutter={[20, 20]}>
                <Row gutter={[12, 10]}>
                    {itemsArray.map((item, i) => {
                        let off_percent = 0;
                        if (item.price && item.price_was && item.price_was > item.price) off_percent = 100 - ((item.price / item.price_was) * 100);

                        return (<Col span={8} key={i}>
                            <div className={cssStyles.thumb} style={{  }}>
                                {item?.picture?.thumbnails ? 
                                    <Image src={`${process.env.NEXT_PUBLIC_CDN_ASSETS}/${item.picture.thumbnails[0]}`} width={142} height={142} alt={item.title} style={{ width:"100%", height:"auto" }} /> : 
                                    <Icon style={{ fontSize: "64px", color: "#999999" }} icon="image" />}
                            </div>
                            {/* <Skeleton.Avatar size={120} shape='square' /> */}

                            {item?.attributes?.length>0 && <Space>
                                {item?.attributes?.map((o, ii) => (<div style={{ border: "1px solid #EDEFF3", backgroundColor: "#F5F6FB" }} key={ii}>{o}</div>))}
                                {/* {!item?.attributes && <div style={{ border: "1px solid #EDEFF3", backgroundColor: "#F5F6FB" }}>attribute</div>} */}
                            </Space>}

                            <div style={{ fontSize: "18px", color: "#3D3D3D" }}>{item.title || <Skeleton.Node style={{ width: "120px", height: "15px" }} />}</div>
                            {off_percent > 0 && <div style={{ fontSize: "12px", color: "#1155CB" }}>{off_percent}% OFF</div>}

                            <Row>
                                <Col flex="auto" style={{ color: "#3D3D3D", fontSize: "14px", fontWeight: "bold" }}>RS{item.price || <Skeleton.Node style={{ width: "50px", height: "15px" }} />}</Col>
                                <Col style={{ color: "#9097A9", fontSize: "14px" }}>{item.price_was > 0 ? `RS${item.price_was}` : ``}</Col>
                            </Row>
                        </Col>)
                    })}
                </Row>
            </ProdSkeleton_ListItem>

            {values?.all_btn?.show && <div align="right" style={{ marginTop:"15px" }}><Button onClick={() => console.log(values.all_btn.link)} size="small">Show All</Button></div>}
        </div>
    </>)
}

const Product = ({ node, name, index }) => (<div style={{ border: "1px solid #999", height: "100px", overflow:"hidden", position:"relative", textAlign:"center" }}>
    <div style={{ position: "relative", width:"100%", height:"80px" }}>
        {node?.picture?.thumbnails && <Image src={node.picture.thumbnails[0]} _width={116} _height={100} fill={true} style={{ objectFit: 'contain' }} />}
    </div>
    <div>{node.title}</div>
</div>)



function ProductProps({ item: { name, data, values } }) {
    const form = useForm()
    const [showProdSelection, set_showProdSelection] = useState(false)

    const getFieldValue = (field_name) => form.getFieldState(`${name}.${field_name}`)

    // console.log("values.title.show: ", getFieldValue('values.title.show')?.value)

    return (<>
        <Space direction='vertical'>

            <FormField name={`${name}.status`} type='select' label="Status" options={publishStatus} validate={rules.required} />

            <Card styles={{ body: { padding: "10px" } }}>
                <Heading>Title</Heading>
                <Row gutter={5} align="bottom">
                    <Col flex="auto"><FormField name={`${name}.values.title.text`} type='text' validate={rules.required} /></Col>
                    <Col><FormField wrapperStyle={{ paddingBottom: "5px" }} name={`${name}.values.title.show`} type='switch' 
                        defaultChecked={false} 
                        // defaultChecked={getFieldValue('values.title.show')?.value === true} 
                        checkedChildren="Show" unCheckedChildren="Hide" /></Col>
                </Row>
            </Card>

            <Card styles={{ body: { padding: "10px" } }}>
                <Heading>Theme</Heading>
                <FormField name={`${name}.values.theme`} type='select' options={
                    [
                        { label: "Blue", value: "blue" },
                        { label: "Green", value: "green" },
                    ]
                } />
            </Card>

            <Card styles={{ body: { padding: "10px" } }}>
                {/* <Heading>Thumbnail Background</Heading>
                <Row gutter={[10, 10]} align="bottom">
                    <Col span={8}><FormField name={`${name}.values.background.type`} type='select' label="Type" options={
                        [
                            { label: "Solid", value: "solid" },
                            { label: "Gradient", value: "gradient" },
                        ]
                    } /></Col>
                    <Col span={9}>
                        {getFieldValue('values.background.type')?.value == 'gradient' && <>
                            <FormField name={`${name}.values.background.direction`} type='select' label="Direction" options={
                                [
                                    { label: "Vertical", value: "vertical" },
                                    { label: "Horizontal", value: "horizontal" },
                                ]
                            } />
                        </>}
                    </Col>

                    <Col span={7}>
                        {getFieldValue('values.background.type')?.value == 'solid' && <>
                            <FormField name={`${name}.values.background.color1`} _label="Color 1" type="color" compact />
                        </>}
                        {getFieldValue('values.background.type')?.value == 'gradient' && <>
                            <Space direction='horizontal'>
                                <FormField name={`${name}.values.background.color1`} _label="Color 1" type="color" compact />
                                <FormField name={`${name}.values.background.color2`} _label="Color 2" type="color" compact />
                            </Space>
                        </>}
                    </Col>
                </Row> */}
                <div style={{ height: "20px" }} />

                <Heading>Number of Products</Heading>
                <FormField name={`${name}.values.num_products`} type='select'
                    options={
                        [
                            { label: "Row 1 / Col 3", value: "3" },
                            { label: "Row 2 / Col 3", value: "6" },
                        ]
                    }
                    onChange={(val) => {
                        let num = Number(val)
                        form.change(`${name}.values.products`, new Array(num).fill({}))
                    }}
                />
                

                <div style={{ height: "10px" }} />
                {/* <p>{`${name}.values.products`}</p> */}
                <div onClick={() => set_showProdSelection(true)}>
                    <FieldArray name={`${name}.values.products`}>
                        {({ fields }) => {
                            return (<>
                                <Row gutter={[5, 5]}>
                                    {fields.map((p_name, index) => {
                                        const thisNode = fields.value[index];

                                        return (<Col span={8} key={index}>
                                            <Product node={thisNode} name={p_name} index={index} />
                                        </Col>)

                                    })}
                                </Row>
                            </>)
                        }}
                    </FieldArray>
                </div>


            </Card>

            <Card styles={{ body: { padding: "10px" } }}>
                <Heading>Buttons</Heading>
                {/* <FormField name={`${name}.values.all_btn.show`} type="checkbox">{`Show "All" Button`}</FormField> */}
                <Row align="bottom" gutter={5}>
                    <Col flex="auto"><FormField name={`${name}.values.all_btn.link`} placeholder="Select page to link" label="All Button" type="text" /></Col>
                    <Col><FormField wrapperStyle={{ paddingBottom: "5px" }} name={`${name}.values.all_btn.show`} type='switch' 
                        defaultChecked={false} 
                        // defaultChecked={getFieldValue('values.all_btn.show')?.value === true} 
                        checkedChildren="Show" unCheckedChildren="Hide" /></Col>
                </Row>
            </Card>

            <Card styles={{ body: { padding: "10px" } }}>
                <Heading>Other Options</Heading>
                <FormField name={`${name}.values.open_as`} type='select' options={
                    [
                        { label: "Open as Pop-up", value: "popup" },
                        { label: "Go to screen", value: "goto_screen" },
                    ]
                } />
            </Card>

            <ComponentStyling name={name} />
            <ComponentSchedule name={name} />

        </Space>

        <Modal title="Select products" onCancel={() => set_showProdSelection(false)} footer={false} open={showProdSelection} width={'1000px'} destroyOnHidden>
            <ProductListSelector 
                selected_products={getFieldValue(`values.products`)?.value}
                limit={getFieldValue('values.num_products')?.value || 3}
                onSubmit={(selectdProds)=>{
                    // console.log("onSubmit: ", selectdProds)
                    let num = Number(getFieldValue('values.num_products')?.value || 0)
                    if (num < 1) {
                        set_showProdSelection(false)
                        form.change(`${name}.values.products`, selectdProds);
                        return;
                    }

                    let arr = new Array(num).fill({});
                    arr = arr.map((o, i) => (selectdProds[i] || {}))

                    set_showProdSelection(false)
                    form.change(`${name}.values.products`, arr)
                }}
            />
            {/* <p>showProdSelection</p>
            <p>Number of Products: {getFieldValue('values.num_products')?.value}</p>
            <DevBlock obj={getFieldValue(`values.products`)?.value} /> */}
        </Modal>

    </>)
}

export default { 
    type: "prod_list_3_2", 
    label: "Product List (3 / 2)", 
    desc: "list 2 by 3",
    renderer: ProductList, 
    propsRender: ProductProps
}
