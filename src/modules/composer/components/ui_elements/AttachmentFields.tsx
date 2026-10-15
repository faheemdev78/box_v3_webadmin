'use client'
import React from 'react'
import { Card, Col, Row } from 'antd'
import { gql } from '@apollo/client'
import { Field, useForm } from 'react-final-form'
import { FormField, SearchableSelect } from '@/components/form'
import { BrandsDD, ProdCatsDD, ProductsDD } from '@/components/dropdowns'
import { Heading } from '../../typography'
import type { ComposerAttachment } from './attachment'

const PAGES = gql`query appPages($filter: String, $others: String) {
    appPages(filter: $filter, others: $others) {
        _id
        title
        slug
        draft
    }
}`

const typeOptions = [
    { label: 'Category', value: 'category' },
    { label: 'Product', value: 'product' },
    { label: 'Brand', value: 'brand' },
    { label: 'Page', value: 'page' },
]

export function AttachmentFields({ name, link, compact }: { name: string; link?: ComposerAttachment | null; compact?: boolean }) {
    const form = useForm()
    const current = link?._id && link.title
        ? [{ value: link._id, title: link.title, label: link.title }]
        : []

    const rememberTitle = (_value: unknown, raw?: { title?: string; label?: string }) => {
        form.change(`${name}.title`, raw?.title || raw?.label || '')
    }

    function renderForm(){
        return (<>
            <Row gutter={[5, 5]}>
                <Col span={8}><FormField
                    name={`${name}.type`}
                    type="select"
                    label="Attach to"
                    allowClear
                    options={typeOptions}
                    onChange={() => {
                        form.change(`${name}._id`, undefined)
                        form.change(`${name}.title`, undefined)
                    }}
                /></Col>
                <Col span={16}>
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
                            if (input.value === 'page') {
                                return (
                                    <SearchableSelect
                                        key="page"
                                        query={PAGES}
                                        queryName="appPages"
                                        static_filter={{ draft: false }}
                                        name={`${name}._id`}
                                        label="Page"
                                        preload
                                        defaultData={current}
                                        resultParser={(results: { _id: string; title?: string; slug?: string; draft?: boolean }[]) => results.map((page) => ({
                                            value: page._id,
                                            label: [page.title, page.slug].filter(Boolean).join(' · '),
                                            title: page.title,
                                            raw: page,
                                        }))}
                                        onChange={rememberTitle}
                                    />
                                )
                            }
                            return null
                        }}
                    </Field>
                </Col>
            </Row>
        </>)
    }

    if (compact){
        return (<>{renderForm()}</>)
    }

    return (
        <Card styles={{ body: { padding: '10px' } }}>
            <Heading style={undefined}>Attach</Heading>
            {renderForm()}
        </Card>
    )
}
