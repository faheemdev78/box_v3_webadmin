'use client'
import React from 'react'
import { Card, Space } from 'antd'
import { Heading } from '../typography'
import { ComponentStyling } from '../lib'
import { PropsFromFields } from './PropsFromFields'
import type { ComposerComponent, ComposerItem } from './types'

export function ComposerProps({ item, component }: { item: ComposerItem; component: ComposerComponent }) {
    return (
        <Space orientation="vertical">
            {component.fields.length > 0 && (
                <Card styles={{ body: { padding: '10px' } }}>
                    <Heading style={{}}>{component.fieldsTitle || 'Value'}</Heading>
                    <PropsFromFields item={item} fields={component.fields} />
                </Card>
            )}
            {component.fields.length === 0 && <p>No props configured yet</p>}
            <ComponentStyling name={item.name} />
        </Space>
    )
}
