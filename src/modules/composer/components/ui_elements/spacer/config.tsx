'use client'
import React from 'react'
import { Card } from 'antd'
import { FormField } from '@/components/form'
import { Heading } from '../../../typography'
import type { ComposerComponent, ComposerItem } from '../../types'
import { BlockProps } from '../BlockProps'
import { canvasShell } from '../blockFrame'

export type SpacerValues = {
    height?: number | string
}

function SpacerPreview({ item }: { item: ComposerItem<SpacerValues> }) {
    const raw = Number(item?.values?.height)
    const height = Number.isFinite(raw) && raw >= 0 ? raw : 24

    return (
        <div style={canvasShell(item, { height: Math.max(height, 40), justifyContent: 'center', border: '1px dashed #89A3BE' })}>
            <span style={{ fontSize: 12, color: '#89A3BE' }}>Spacer</span>
        </div>
    )
}

function SpacerProps({ item }: { item: ComposerItem<SpacerValues> }) {
    return (
        <BlockProps item={item}>
            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Height</Heading>
                <FormField name={`${item.name}.values.height`} type="number" label="Component height" />
            </Card>
        </BlockProps>
    )
}

export const spacerComponent: ComposerComponent<SpacerValues> = {
    type: 'spacer',
    label: 'Spacer',
    desc: 'Empty vertical space',
    category: 'ui_elements',
    placement: 'body',
    defaults: { height: 24 },
    fields: [],
    Preview: SpacerPreview,
    Props: SpacerProps,
    serialize: (values) => ({
        height: Number.isFinite(Number(values?.height)) && Number(values?.height) >= 0 ? Number(values?.height) : 24,
    }),
}
