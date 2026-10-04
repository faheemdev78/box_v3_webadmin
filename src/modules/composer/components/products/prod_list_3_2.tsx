'use client'
import { cdnImageUrl } from '@/lib/cdnImageUrl';
// Legacy product thumbnails were always prefixed with NEXT_PUBLIC_CDN_URL.

import React, { useEffect, useState } from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import { Alert, Card, Col, ColorPicker, Divider, Modal, Row, Skeleton, Space } from 'antd';
import { Heading } from '../../typography';
import { useForm, Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import { ProductListSelector } from '@/modules/products/components';
import cssStyles from './productList.module.scss'
import { ComponentSchedule, ComponentStyling, parseStylesOutput } from '../../lib';
import { Image, Avatar, Button, Icon, Loader, ProdSkeleton_ListItem } from '@/components';
import { publishStatus } from '@/configs';
import { __error } from '@/lib/consoleHelper';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import { RenderProduct } from './RenderProduct'

interface ComposerProduct {
    _id?: string;
    title?: string;
    picture?: { thumbnails?: string[] } | null;
    attributes?: { val?: React.ReactNode; title?: React.ReactNode }[] | null;
    price?: number | null;
    price_was?: number | null;
}

interface ProductListValues {
    title?: { show?: boolean; text?: string };
    all_btn?: { show?: boolean; link?: string };
    num_products?: number | string;
    theme?: string;
    products?: ComposerProduct[];
    open_as?: string;
}

interface ProductListItem {
    name: string;
    data?: unknown;
    values?: ProductListValues | null;
    schedule_start?: string | number | null;
    schedule_end?: string | number | null;
    sort_order?: number;
    styles?: Record<string, unknown>;
    status?: string;
}

interface ProductListProps {
    item: ProductListItem;
    onProductsLoad?: (products: ComposerProduct[]) => void;
}

interface ProductPropsItem {
    node: ComposerProduct;
    name: string;
    index: number;
}

function ProductList({ onProductsLoad, item: { data, schedule_start, schedule_end, values, sort_order, styles, status, name } }: ProductListProps) {
    const {currency} = useAppSelector(getSettings)

    let style: React.CSSProperties = parseStylesOutput(styles)
    if (status == 'offline') Object.assign(style, { opacity: 0.5 })

    const { all_btn, num_products, theme, products } = values || {};
    const _num_products = Number(num_products || 3);

    let isScheduled = (schedule_start || schedule_end)

    let itemsArray: ComposerProduct[] = products || new Array<ComposerProduct>(_num_products).fill({})

    return (<>
        <div className={cssStyles.comp_prod_list} style={style}>
            <div className={cssStyles.feature_icons}><Space orientation='vertical' size={2}>
                {isScheduled && <Icon icon="clock" />}
            </Space></div>

            {values?.title?.show && <h2>{values.title.text}</h2>}

            <Row gutter={[12, 10]}>
                {itemsArray.map((item: ComposerProduct, i: number) => {
                    let off_percent = 0;
                    if (item.price && item.price_was && item.price_was > item.price) off_percent = 100 - ((item.price / item.price_was) * 100);

                    return (<Col span={8} key={i}>
                        <RenderProduct item={item} off_percent={off_percent} currency={currency} />
                    </Col>)
                })}
            </Row>

            {values?.all_btn?.show && <div style={{ marginTop: "15px", textAlign: "right" }}><Button onClick={() => console.log(values.all_btn?.link)} size="small">Show All</Button></div>}
        </div>
    </>)
}

const Product = ({ node, name, index }: ProductPropsItem) => (<div style={{ border: "1px solid #999", height: "100px", overflow:"hidden", position:"relative", textAlign:"center" }}>
    <div style={{ position: "relative", width:"100%", height:"80px" }}>
        {node?.picture?.thumbnails && <Image src={node.picture.thumbnails[0]} {...{ _width: 116, _height: 100 }} fill={true} style={{ objectFit: 'contain' }} alt={node.title || ""} />}
    </div>
    <div>{node.title}</div>
</div>)



function ProductProps({ item: { name, data, values } }: Pick<ProductListProps, 'item'>) {
    const form = useForm<Record<string, unknown>>()
    const [showProdSelection, set_showProdSelection] = useState(false)

    const getFieldValue = (field_name: string) => form.getFieldState(`${name}.${field_name}`)

    return (<>
        <Space orientation='vertical'>

            <FormField name={`${name}.status`} type='select' label="Status" options={publishStatus} validate={rules.required} />

            <Card styles={{ body: { padding: "10px" } }}>
                <Heading style={undefined}>Title</Heading>
                <Row gutter={5} align="bottom">
                    <Col flex="auto"><FormField name={`${name}.values.title.text`} type='text' validate={rules.required} /></Col>
                    <Col><FormField wrapperStyle={{ paddingBottom: "5px" }} name={`${name}.values.title.show`} type='switch' 
                        defaultChecked={false} 
                        // defaultChecked={getFieldValue('values.title.show')?.value === true} 
                        checkedChildren="Show" unCheckedChildren="Hide" /></Col>
                </Row>
            </Card>

            <Card styles={{ body: { padding: "10px" } }}>
                <Heading style={undefined}>Theme</Heading>
                <FormField name={`${name}.values.theme`} type='select' options={
                    [
                        { label: "Blue", value: "blue" },
                        { label: "Green", value: "green" },
                    ]
                } />
            </Card>

            <Card styles={{ body: { padding: "10px" } }}>
                <div style={{ height: "20px" }} />

                <Heading style={undefined}>Number of Products</Heading>
                <FormField name={`${name}.values.num_products`} type='select'
                    options={
                        [
                            { label: "Row 1 / Col 3", value: "3" },
                            { label: "Row 2 / Col 3", value: "6" },
                        ]
                    }
                    onChange={(val: string | number) => {
                        let num = Number(val)
                        form.change(`${name}.values.products`, new Array<ComposerProduct>(num).fill({}))
                    }}
                />
                

                <div style={{ height: "10px" }} />
                {/* <p>{`${name}.values.products`}</p> */}
                <div onClick={() => set_showProdSelection(true)}>
                    <FieldArray<ComposerProduct> name={`${name}.values.products`}>
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
                <Heading style={undefined}>Buttons</Heading>
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
                <Heading style={undefined}>Other Options</Heading>
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
            <Field<number | string> name={`${name}.values.num_products`} subscription={{ value: true }}>
                {({ input })=>{
                    let limit = input.value || 3;

                    return (<>
                        <Field<ComposerProduct[]> name={`${name}.values.products`} subscription={{ value: true }}>
                            {(products)=>{
                                return (<>
                                    <ProductListSelector
                                        selected_products={products.input.value}
                                        limit={limit}
                                        onSubmit={(selectdProds: ComposerProduct[]) => {
                                            let num = Number(limit || 0)
                                            if (num < 1) {
                                                set_showProdSelection(false)
                                                form.change(`${name}.values.products`, selectdProds);
                                                return;
                                            }

                                            let arr = new Array<ComposerProduct>(num).fill({});
                                            arr = arr.map((o, i) => (selectdProds[i] || {}))

                                            set_showProdSelection(false)
                                            form.change(`${name}.values.products`, arr)
                                        }}
                                    />
                                </>)
                            }}
                        </Field>


                    </>)
                }}
            </Field>

            {/* <ProductListSelector 
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
            /> */}
            {/* <p>showProdSelection</p>
            <p>Number of Products: {getFieldValue('values.num_products')?.value}</p>
            <DevBlock obj={getFieldValue(`values.products`)?.value} /> */}
        </Modal>

    </>)
}

const ProductListComponent = {
    type: "prod_list_3_2",
    label: "Product List (3 / 2)",
    desc: "list 2 by 3",
    renderer: ProductList,
    propsRender: ProductProps,
    displayName: "ProductListComponent"
};

export default ProductListComponent;
