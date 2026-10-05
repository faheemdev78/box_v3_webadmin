'use client'
import React from 'react'
import { Card } from 'antd'
import { Field, useForm } from 'react-final-form'
import { FormField } from '@/components/form'
import { BrandsDD, ProdCatsDD, ProductsDD } from '@/components/dropdowns'
import { Heading } from '../../typography'
import type { ComposerAttachment } from './attachment'

const typeOptions = [
    { label: 'Category', value: 'category' },
    { label: 'Product', value: 'product' },
    { label: 'Brand', value: 'brand' },
]

export function AttachmentFields({ name, link }: { name: string; link?: ComposerAttachment | null }) {
    const form = useForm()
    const current = link?._id && link.title
        ? [{ value: link._id, title: link.title, label: link.title }]
        : []

    const rememberTitle = (_value: unknown, raw?: { title?: string; label?: string }) => {
        form.change(`${name}.title`, raw?.title || raw?.label || '')
    }

    return (
        <Card styles={{ body: { padding: '10px' } }}>
            <Heading style={undefined}>Attach</Heading>
            <FormField
                name={`${name}.type`}
                type="select"
                label="Attach to"
                allowClear
                options={typeOptions}
                onChange={() => {
                    form.change(`${name}._id`, undefined)
                    form.change(`${name}.title`, undefined)
                }}
            />
            <Field name={`${name}.type`} subscription={{ value: true }}>
                {({ input }) => {
                    if (input.value === 'category') {
                        return <ProdCatsDD key="category" name={`${name}._id`} label="Category" preload defaultData={current} onChange={rememberTitle} />
                    }
                    if (input.value === 'product') {
                        return <ProductsDD key="product" name={`${name}._id`} label="Product" preload defaultData={current} onChange={rememberTitle} />
                    }
                    if (input.value === 'brand') {
                        return <BrandsDD key="brand" name={`${name}._id`} label="Brand" preload defaultData={current} onChange={rememberTitle} />
                    }
                    return null
                }}
            </Field>
        </Card>
    )
}
