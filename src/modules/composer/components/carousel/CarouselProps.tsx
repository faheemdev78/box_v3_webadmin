'use client'
import React, { useState } from 'react'
import { Card, Col, Row, Space } from 'antd'
import { FieldArray } from 'react-final-form-arrays'
import { FormField } from '@/components/form'
import { Image } from '@/components'
import { publishStatus } from '@/configs'
import { Heading } from '../../typography'
import { ComponentSchedule, ComponentStyling } from '../../lib'
import { ProductSelectModal } from '../products/ProductSelectModal'
import type { ComposerItem } from '../types'
import type { ComposerProduct } from '../products/types'
import type { CarouselValues } from './types'
import { CAROUSEL_PRODUCT_LIMIT } from './types'

function ProductThumb({ node }: { node: ComposerProduct }) {
    return (
        <div style={{ border: '1px solid #999', minHeight: '100px', overflow: 'hidden', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100%', height: '80px' }}>
                {node?.picture?.thumbnails && (
                    <Image src={node.picture.thumbnails[0]} {...{ _width: 116, _height: 100 }} fill style={{ objectFit: 'contain' }} alt={node.title || ''} />
                )}
            </div>
            <div>{node.title || 'Empty'}</div>
        </div>
    )
}

const SLIDE_NAVIGATION = [
    { label: "Don't show", value: 'none' },
    { label: 'Show dots', value: 'dots' },
    { label: 'Show dash lines', value: 'dashes' },
    { label: 'Show arrows', value: 'arrows' },
]

const SCROLL_NAVIGATION = [
    { label: "Don't show", value: 'none' },
    { label: 'Show arrows', value: 'arrows' },
]

export function CarouselProps({ item }: { item: ComposerItem<CarouselValues> }) {
    const { name } = item
    const [open, setOpen] = useState(false)
    const freeScroll = item?.data?.type === 'scroll_product'

    return (<>
        <Space orientation="vertical">
            <FormField name={`${name}.status`} type="select" label="Status" options={publishStatus} />

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Theme</Heading>
                <FormField name={`${name}.values.theme`} type="color" label="Text color" />
                <FormField name={`${name}.values.columns`} type="number" label="Columns" />
                {!freeScroll && <FormField name={`${name}.values.rows`} type="number" label="Rows" />}
                <FormField name={`${name}.values.gutter`} type="number" label="Gutter" min={0} max={80} />
                <FormField
                    name={`${name}.values.navigation`}
                    type="select"
                    label="Show navigation"
                    options={freeScroll ? SCROLL_NAVIGATION : SLIDE_NAVIGATION}
                />
                {freeScroll && <div style={{ color: '#666', marginBottom: 8 }}>Shoppers drag this row sideways, and it eases to a stop. Columns is how many products fit on screen.</div>}
                {!freeScroll && <>
                    <FormField name={`${name}.values.autoplay`} type="number" label="Auto play (seconds)" min={0} max={300} step={1} />
                    <div style={{ color: '#666', marginBottom: 8 }}>Seconds between moves. Use 0 to keep auto play off.</div>
                </>}
            </Card>

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Products</Heading>
                <div style={{ marginBottom: '8px' }}>Up to {CAROUSEL_PRODUCT_LIMIT}. Drag items in the selector to set their order.</div>
                <div onClick={() => setOpen(true)}>
                    <FieldArray<ComposerProduct> name={`${name}.values.products`}>
                        {({ fields }) => (
                            <Row gutter={[5, 5]}>
                                {fields.map((fieldName, index) => (
                                    <Col span={8} key={fieldName}>
                                        <ProductThumb node={fields.value[index]} />
                                    </Col>
                                ))}
                                {!fields.length && <Col span={24}><div style={{ color: '#999' }}>Click to select products</div></Col>}
                            </Row>
                        )}
                    </FieldArray>
                </div>
            </Card>

            <ComponentStyling name={name} />
            <ComponentSchedule name={name} />
        </Space>

        <ProductSelectModal
            open={open}
            onClose={() => setOpen(false)}
            fieldName={`${name}.values.products`}
            limit={CAROUSEL_PRODUCT_LIMIT}
        />
    </>)
}
