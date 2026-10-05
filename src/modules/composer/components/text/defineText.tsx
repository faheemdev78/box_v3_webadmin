'use client'
import React from 'react'
import { TextBlockPreview, type TextValues } from './TextBlockPreview'
import type { ComposerComponent } from '../types'

export function defineText({ type, label, desc, className, emptyLabel }: {
    type: string
    label: string
    desc: string
    className?: string
    emptyLabel: string
}): ComposerComponent<TextValues> {
    return {
        type,
        label,
        desc,
        category: 'text',
        placement: 'body',
        defaults: { value: '', color: '#000000' },
        fields: [
            { key: 'value', label: 'Value', type: 'text' },
            { key: 'color', label: 'Text color', type: 'color' },
        ],
        Preview: ({ item }) => <TextBlockPreview item={item} className={className} emptyLabel={emptyLabel} />,
    }
}
