'use client'
import React from 'react'
import { Col, Row } from 'antd'
import { FormField } from '@/components/form'
import type { ComposerField } from './types'

export function PropsFromFields({ item, fields }: { item: { name?: string }; fields: ComposerField[] }) {
    return (
        <Row gutter={[10, 10]}>
            {fields.map((field) => (
                <Col span={field.type === 'switch' ? 12 : 24} key={field.key}>
                    <FormField
                        label={field.label}
                        name={`${item.name}.values.${field.key}`}
                        type={field.type}
                        options={field.options}
                    />
                </Col>
            ))}
        </Row>
    )
}
