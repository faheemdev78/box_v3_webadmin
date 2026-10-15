'use client'
import React from 'react'
import { Card, Space } from 'antd'
import { ComponentStyling } from '../../../lib'
import { PropsFromFields } from '../../PropsFromFields'
import type { ComposerItem } from '../../types'
import type { SearchHeaderValues } from './config'

export function SearchHeaderProps({ item }: { item: ComposerItem<SearchHeaderValues> }) {
    return <Space orientation="vertical" style={{ width: '100%' }}>
        <Card styles={{ body: { padding: 10 } }}>
            <PropsFromFields item={item} fields={[{ key: 'theme', label: 'Theme', type: 'color' }]} />
        </Card>
        <ComponentStyling name={item.name || ''} showBorder={false} />
    </Space>
}
