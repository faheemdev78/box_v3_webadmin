'use client'
import React, { useState } from 'react'
import { Card, Col, Row, Space } from 'antd'
import { Field, useForm } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import { FormField, rules } from '@/components/form'
import { Image } from '@/components'
import { publishStatus } from '@/configs'
import { Heading } from '../../../typography'
import { ComponentSchedule, ComponentStyling } from '../../../lib'
import type { ComposerItem } from '../../types'
import type { ComposerProduct, ProductListValues } from '../types'
import { ProductSelectModal } from '../ProductSelectModal'

function ProductThumb({ node }: { node: ComposerProduct }) {
    return (
        <div style={{ border: '1px solid #999', height: '100px', overflow: 'hidden', position: 'relative', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100%', height: '80px' }}>
                {node?.picture?.thumbnails && (
                    <Image src={node.picture.thumbnails[0]} {...{ _width: 116, _height: 100 }} fill={true} style={{ objectFit: 'contain' }} alt={node.title || ''} />
                )}
            </div>
            <div>{node.title}</div>
        </div>
    )
}

export function ProdListProps({ item }: { item: ComposerItem<ProductListValues> }) {
    const { name } = item
    const form = useForm<Record<string, unknown>>()
    const [showProdSelection, set_showProdSelection] = useState(false)

    return (<>
        <Space orientation="vertical">
            <FormField name={`${name}.status`} type="select" label="Status" options={publishStatus} validate={rules.required} />

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Title</Heading>
                <Row gutter={5} align="bottom">
                    <Col flex="auto"><FormField name={`${name}.values.title.text`} type="text" validate={rules.required} /></Col>
                    <Col>
                        <FormField
                            wrapperStyle={{ paddingBottom: '5px' }}
                            name={`${name}.values.title.show`}
                            type="switch"
                            defaultChecked={false}
                            checkedChildren="Show"
                            unCheckedChildren="Hide"
                        />
                    </Col>
                </Row>
            </Card>

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Theme</Heading>
                <FormField name={`${name}.values.theme`} type="color" label="Text color" />
            </Card>

            <Card styles={{ body: { padding: '10px' } }}>
                <div style={{ height: '20px' }} />
                <Heading style={undefined}>Number of Products</Heading>
                <FormField
                    name={`${name}.values.num_products`}
                    type="select"
                    options={[
                        { label: 'Row 1 / Col 3', value: '3' },
                        { label: 'Row 2 / Col 3', value: '6' },
                    ]}
                    onChange={(val: string | number) => {
                        const num = Number(val)
                        form.change(`${name}.values.products`, new Array<ComposerProduct>(num).fill({}))
                    }}
                />

                <div style={{ height: '10px' }} />
                <div onClick={() => set_showProdSelection(true)}>
                    <FieldArray<ComposerProduct> name={`${name}.values.products`}>
                        {({ fields }) => (
                            <Row gutter={[5, 5]}>
                                {fields.map((p_name, index) => {
                                    const thisNode = fields.value[index]
                                    return (
                                        <Col span={8} key={index}>
                                            <ProductThumb node={thisNode} />
                                        </Col>
                                    )
                                })}
                            </Row>
                        )}
                    </FieldArray>
                </div>
            </Card>

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Buttons</Heading>
                <Row align="bottom" gutter={5}>
                    <Col flex="auto">
                        <FormField name={`${name}.values.all_btn.link`} placeholder="Select page to link" label="All Button" type="text" />
                    </Col>
                    <Col>
                        <FormField
                            wrapperStyle={{ paddingBottom: '5px' }}
                            name={`${name}.values.all_btn.show`}
                            type="switch"
                            defaultChecked={false}
                            checkedChildren="Show"
                            unCheckedChildren="Hide"
                        />
                    </Col>
                </Row>
            </Card>

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Other Options</Heading>
                <FormField name={`${name}.values.open_as`} type="select" options={[
                    { label: 'Open as Pop-up', value: 'popup' },
                    { label: 'Go to screen', value: 'goto_screen' },
                ]} />
            </Card>

            <ComponentStyling name={name} />
            <ComponentSchedule name={name} />
        </Space>

        <Field<number | string> name={`${name}.values.num_products`} subscription={{ value: true }}>
            {({ input }) => (
                <ProductSelectModal
                    open={showProdSelection}
                    onClose={() => set_showProdSelection(false)}
                    fieldName={`${name}.values.products`}
                    limit={Number(input.value || 3)}
                    padTo={Number(input.value || 3)}
                />
            )}
        </Field>
    </>)
}
