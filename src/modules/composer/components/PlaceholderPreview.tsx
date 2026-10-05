'use client'
import React from 'react'
import type { CSSProperties } from 'react'
import { parseStylesOutput } from '../lib'
import { productInk } from './products/theme'
import type { ComposerCategory, ComposerComponent, ComposerField, ComposerItem } from './types'

export function PlaceholderPreview({ item, className, emptyLabel }: {
    item: ComposerItem
    className?: string
    emptyLabel: string
}) {
    const style = parseStylesOutput(item?.styles || {}) as CSSProperties
    const text = typeof item?.values === 'string' ? item.values : undefined
    const theme = item?.values && typeof item.values === 'object' && 'theme' in item.values
        ? String((item.values as { theme?: string }).theme || '')
        : ''
    const ink = theme ? productInk(theme) : '#999'

    return (
        <div className={className} style={style}>
            {text || <span style={{ color: ink }}>{emptyLabel}</span>}
        </div>
    )
}

export function definePlaceholder({ type, label, desc, category, className, emptyLabel, defaults, fields }: {
    type: string
    label: string
    desc: string
    category: ComposerCategory
    className?: string
    emptyLabel: string
    defaults?: Record<string, unknown>
    fields?: ComposerField[]
}): ComposerComponent {
    return {
        type,
        label,
        desc,
        category,
        placement: 'body',
        defaults: defaults || {},
        fields: fields || [],
        Preview: ({ item }) => <PlaceholderPreview item={item} className={className} emptyLabel={emptyLabel} />,
    }
}
