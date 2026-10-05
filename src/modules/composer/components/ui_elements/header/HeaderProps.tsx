'use client'

import React from 'react'
import { Button, Card, Col, Row, Select, Space } from 'antd'
import { gql } from '@apollo/client'
import { Field, useForm } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FormField, SearchableSelect } from '@/components/form'
import { ProdCatsDD, ProductsDD } from '@/components/dropdowns'
import { Heading } from '../../../typography'
import { ComponentStyling } from '../../../lib'
import { PropsFromFields } from '../../PropsFromFields'
import { solidIcon, solidIconOptions } from '@/modules/categories/solidIcons'
import type { ComposerItem } from '../../types'
import { headerFields, type HeaderBarItem, type HeaderBarLink, type HeaderValues } from './config'
import { DeleteButton } from '@/components'

const PAGES = gql`query appPages($filter: String, $others: String) {
    appPages(filter: $filter, others: $others) {
        _id
        title
        slug
        draft
    }
}`

const linkTypes = [
    { label: 'Page', value: 'page' },
    { label: 'Category', value: 'category' },
    { label: 'Product', value: 'product' },
]

function IconChoice({ name }: { name?: string | null }) {
    const icon = solidIcon(name)
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {icon && <FontAwesomeIcon icon={icon} fixedWidth />}
            <span>{name}</span>
        </span>
    )
}

function BarItemLink({ name, link }: { name: string; link?: HeaderBarLink | null }) {
    const form = useForm()
    const current = link?._id && link.title ? [{ value: link._id, title: link.title, label: link.title }] : []
    const rememberTitle = (_value: unknown, raw?: { title?: string; label?: string }) => {
        form.change(`${name}.title`, raw?.title || raw?.label || '')
    }

    return (
        <Row gutter={[10, 10]}>
            <Col flex={12}>
                <FormField
                    name={`${name}.type`}
                    type="select"
                    label="Link to"
                    allowClear
                    options={linkTypes}
                    onChange={() => {
                        form.change(`${name}._id`, undefined)
                        form.change(`${name}.title`, undefined)
                    }}
                />
            </Col>
            <Col flex={12}>
                <Field name={`${name}.type`} subscription={{ value: true }}>
                    {({ input }) => {
                        if (input.value === 'page') {
                            return (
                                <SearchableSelect
                                    key="page"
                                    query={PAGES}
                                    queryName="appPages"
                                    name={`${name}._id`}
                                    label="Page"
                                    preload
                                    defaultData={current}
                                    resultParser={(results: { _id: string; title?: string; slug?: string; draft?: boolean }[]) => results.map((page) => ({
                                        value: page._id,
                                        label: [page.title, page.slug, page.draft ? 'draft' : ''].filter(Boolean).join(' · '),
                                        title: page.title,
                                        raw: page,
                                    }))}
                                    onChange={rememberTitle}
                                />
                            )
                        }
                        if (input.value === 'category') {
                            return <ProdCatsDD key="category" name={`${name}._id`} label="Category" preload defaultData={current} onChange={rememberTitle} />
                        }
                        if (input.value === 'product') {
                            return <ProductsDD key="product" name={`${name}._id`} label="Product" preload defaultData={current} onChange={rememberTitle} />
                        }
                        return null
                    }}
                </Field>
            </Col>
        </Row>
    )
}

function BarItem({ name, item, onRemove }: { name: string; item?: HeaderBarItem; onRemove: () => void }) {
    return (<Card size="small" styles={{ body: { padding: '10px' } }}>
        <Row gutter={[5, 10]}>
            <Col span={12}><div>
                <Field name={`${name}.icon`}>
                    {({ input }) => (<div>
                        <div style={{ marginBottom: 0 }}>Icon</div>
                        <Select
                            showSearch
                            allowClear
                            virtual
                            style={{ width: '100%', fontSize:13 }}
                            placeholder="Search icons"
                            optionFilterProp="label"
                            listHeight={280}
                            value={input.value || undefined}
                            options={solidIconOptions}
                            onChange={(value) => input.onChange(value || null)}
                            optionRender={(option) => <IconChoice name={String(option.value || '')} />}
                            labelRender={(option) => <IconChoice name={String(option.value || '')} />}
                        />
                    </div>)}
                </Field>
            </div></Col>
            <Col span={12}><FormField name={`${name}.label`} type="text" label="Label" /></Col>
            <Col span={24}><BarItemLink name={`${name}.link`} link={item?.link} /></Col>
            <Col span={24} align="right"><DeleteButton onClick={onRemove} /></Col>
        </Row>
    </Card>)
    return (
        <Card size="small" styles={{ body: { padding: '10px' } }}>
            <Space orientation="vertical" style={{ width: '100%' }}>
                <FormField name={`${name}.label`} type="text" label="Label" />
                <Field name={`${name}.icon`}>
                    {({ input }) => (
                        <div>
                            <div style={{ marginBottom: 4 }}>Icon</div>
                            <Select
                                showSearch
                                allowClear
                                virtual
                                style={{ width: '100%' }}
                                placeholder="Search icons"
                                optionFilterProp="label"
                                listHeight={280}
                                value={input.value || undefined}
                                options={solidIconOptions}
                                onChange={(value) => input.onChange(value || null)}
                                optionRender={(option) => <IconChoice name={String(option.value || '')} />}
                                labelRender={(option) => <IconChoice name={String(option.value || '')} />}
                            />
                        </div>
                    )}
                </Field>
                <BarItemLink name={`${name}.link`} link={item?.link} />
                <Button onClick={onRemove}>Remove</Button>
            </Space>
        </Card>
    )
}

export function HeaderProps({ item }: { item: ComposerItem<HeaderValues> }) {
    const name = item.name || ''

    return (
        <Space orientation="vertical">
            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={{}}>{'Visual Elements'}</Heading>
                <PropsFromFields item={item} fields={headerFields} />
            </Card>
            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={{}}>{'Category bar'}</Heading>
                <FieldArray<HeaderBarItem> name={`${name}.values.items`}>
                    {({ fields }) => (
                        <Space orientation="vertical" style={{ width: '100%' }}>
                            {fields.map((fieldName, index) => (
                                <BarItem
                                    key={fieldName}
                                    name={fieldName}
                                    item={fields.value?.[index]}
                                    onRemove={() => fields.remove(index)}
                                />
                            ))}
                            <Button onClick={() => fields.push({ label: '', icon: null, link: null })}>Add item</Button>
                        </Space>
                    )}
                </FieldArray>
            </Card>
            <ComponentStyling name={name} />
        </Space>
    )
}
