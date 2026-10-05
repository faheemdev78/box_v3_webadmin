'use client'
import React from 'react'
import { Col, Row } from 'antd'
import { FormField } from '@/components/form'
import type { ComposerField } from './types'

export function PropsFromFields({ item, fields }: { item: { name?: string }; fields: ComposerField[] }) {
    return (
        <Row gutter={[10, 10]}>
            {fields.map((field) => {
                console.log("field: ", field)
                console.log(!!(['switch', 'color'].includes(field.type) ))
                let span = 24;
                if (['switch'].includes(field.type)) span = 12;
                if (['color'].includes(field.type)) span = 4;
                if (field.key==='logo') span = 20;
                return (
                    <Col span={span} key={field.key}>
                        <FormField
                            label={field.label}
                            name={`${item.name}.values.${field.key}`}
                            type={field.type}
                            options={field.options}
                        />
                    </Col>
                )
            })}
        </Row>
    )
}
