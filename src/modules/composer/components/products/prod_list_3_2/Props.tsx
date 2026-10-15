'use client'
import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Space } from 'antd'
import { useForm, useFormState } from 'react-final-form'
import get from 'lodash/get'
import { FormField, Label, rules } from '@/components/form'
import { Button } from '@/components'
import { publishStatus } from '@/configs'
import { Heading } from '../../../typography'
import { ComponentSchedule, ComponentStyling } from '../../../lib'
import type { ComposerItem } from '../../types'
import { productGrid, type ComposerProduct, type ProductListValues } from '../types'
import { ProductSelectModal } from '../ProductSelectModal'
import { ProductPictures } from '../ProductPictures'
import { AttachmentFields } from '../../ui_elements/AttachmentFields'

function committedCount(value: unknown, max: number) {
    const count = Number(value)
    if (!Number.isFinite(count) || count < 1) return null
    return Math.min(max, Math.floor(count))
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
        if (!listValues?.open_as) form.change(`${name}.values.open_as`, 'goto_screen')
    }, [form, name, listValues?.open_as])

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

            {/* <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Theme</Heading>
                <FormField name={`${name}.values.theme`} type="color" label="Text color" />
            </Card> */}

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Layout</Heading>

                <Space orientation='horizontal'>
                    <FormField name={`${name}.values.theme`} type="color" label="Text" />
                    <FormField name={`${name}.values.columns`} type="number" label="Columns" min={1} max={6} />
                    <FormField name={`${name}.values.rows`} type="number" label="Rows" min={1} max={4} />
                    <FormField name={`${name}.values.gutter`} type="number" label="Gutter" min={0} max={80} />
                </Space>
                {/* <Space>
                    <FormField name={`${name}.values.thumb_background`} type="color" />
                    <Label>Thumb Background</Label>
                </Space> */}
                

                <div style={{ height: '10px' }} />
                <Button htmlType="button" onClick={() => set_showProdSelection(true)}>Choose products</Button>
                <ProductPictures name={name || ''} />
            </Card>

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Button</Heading>
                <Row align="bottom" gutter={5}>
                    <Col flex="auto">
                        <FormField name={`${name}.values.all_btn.text`} placeholder="Show All" label="Button text" type="text" />
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
                <AttachmentFields name={`${name}.values.all_btn.attachment`} link={listValues?.all_btn?.attachment} compact />

                {/* <FormField name={`${name}.values.open_as`} type="select" label="Open as" options={[
                    { label: 'navigate to page', value: 'goto_screen' },
                    { label: 'open as bottom drawer', value: 'popup' },
                ]} /> */}
            </Card>

            {/* <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Other Options</Heading>
                <FormField name={`${name}.values.open_as`} type="select" options={[
                    { label: 'navigate to page', value: 'goto_screen' },
                    { label: 'open as bottom drawer', value: 'popup' },
                ]} />
            </Card> */}

            <Card styles={{ body: { padding: '10px' } }}>
                <ComponentStyling name={name} />
            </Card>
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
