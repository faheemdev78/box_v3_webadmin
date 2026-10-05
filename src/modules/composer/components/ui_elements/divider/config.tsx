'use client'
import React from 'react'
import { Card, Divider } from 'antd'
import { FormField } from '@/components/form'
import { Heading } from '../../../typography'
import type { ComposerComponent, ComposerItem } from '../../types'
import { BlockProps } from '../BlockProps'
import { canvasShell } from '../blockFrame'
import { AttachmentFields } from '../AttachmentFields'
import { serializeAttachment, type ComposerAttachment } from '../attachment'

export type DividerValues = {
    text?: string
    link?: ComposerAttachment | null
}

function DividerPreview({ item }: { item: ComposerItem<DividerValues> }) {
    const text = item?.values?.text?.trim()

    return (
        <div style={canvasShell(item)}>
            <Divider style={{ margin: 0, width: '100%' }}>{text || undefined}</Divider>
        </div>
    )
}

function DividerProps({ item }: { item: ComposerItem<DividerValues> }) {
    return (
        <BlockProps item={item}>
            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Text</Heading>
                <FormField name={`${item.name}.values.text`} type="text" label="Text" />
            </Card>
            <AttachmentFields name={`${item.name}.values.link`} link={item.values?.link} />
        </BlockProps>
    )
}

export const dividerComponent: ComposerComponent<DividerValues> = {
    type: 'divider',
    label: 'Divider',
    desc: 'Line with optional text',
    category: 'ui_elements',
    placement: 'body',
    defaults: { text: '' },
    fields: [],
    Preview: DividerPreview,
    Props: DividerProps,
    serialize: (values) => ({
        text: values?.text?.trim() || '',
        link: serializeAttachment(values?.link),
    }),
}
