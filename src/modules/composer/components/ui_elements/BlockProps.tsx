'use client'
import React from 'react'
import type { ReactNode } from 'react'
import { Space } from 'antd'
import { FormField } from '@/components/form'
import { publishStatus } from '@/configs'
import { ComponentSchedule, ComponentStyling } from '../../lib'
import type { ComposerItem } from '../types'

export function BlockProps({ item, children }: { item: ComposerItem; children?: ReactNode }) {
    const { name } = item

    return (
        <Space orientation="vertical">
            <FormField name={`${name}.status`} type="select" label="Status" options={publishStatus} />
            {children}
            <ComponentStyling name={name} />
            <ComponentSchedule name={name} />
        </Space>
    )
}
