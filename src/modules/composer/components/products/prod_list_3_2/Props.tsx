'use client'
import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Space } from 'antd'
import { useForm, useFormState } from 'react-final-form'
import get from 'lodash/get'
import { FieldArray } from 'react-final-form-arrays'
import { FormField, rules } from '@/components/form'
import { Image } from '@/components'
import { publishStatus } from '@/configs'
import { Heading } from '../../../typography'
import { ComponentSchedule, ComponentStyling } from '../../../lib'
import type { ComposerItem } from '../../types'
import { productGrid, type ComposerProduct, type ProductListValues } from '../types'
import { ProductSelectModal } from '../ProductSelectModal'

function committedCount(value: unknown, max: number) {
    const count = Number(value)
    if (!Number.isFinite(count) || count < 1) return null
    return Math.min(max, Math.floor(count))
}

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
    const formValues = useFormState({ subscription: { values: true } }).values
    const listValues = get(formValues, `${name}.values`) as ProductListValues | undefined
    const columns = committedCount(listValues?.columns, 6)
    const rows = committedCount(listValues?.rows, 4)
    const grid = productGrid(listValues)
    const slotCount = (columns ?? grid.columns) * (rows ?? grid.rows)
    const [showProdSelection, set_showProdSelection] = useState(false)

    useEffect(() => {
        if (columns == null || rows == null) return
        const limit = columns * rows
        const state = form.getState().values
        const current = get(state, `${name}.values.products`)
        const list = (Array.isArray(current) ? current : []) as ComposerProduct[]
        const numProducts = get(state, `${name}.values.num_products`)
        if (list.length === limit && String(numProducts) === String(limit)) return
        const next = list.slice(0, limit)
        while (next.length < limit) next.push({})
        form.change(`${name}.values.products`, next)
        form.change(`${name}.values.num_products`, String(limit))
    }, [columns, rows, form, name])

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
                <Heading style={undefined}>Layout</Heading>
                <Row gutter={8}>
                    <Col span={12}>
                        <FormField name={`${name}.values.columns`} type="number" label="Columns" min={1} max={6} />
                    </Col>
                    <Col span={12}>
                        <FormField name={`${name}.values.rows`} type="number" label="Rows" min={1} max={4} />
                    </Col>
                </Row>
                <FormField name={`${name}.values.gutter`} type="number" label="Gutter" min={0} max={80} />

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

        <ProductSelectModal
            open={showProdSelection}
            onClose={() => set_showProdSelection(false)}
            fieldName={`${name}.values.products`}
            limit={slotCount}
            padTo={slotCount}
        />
    </>)
}
