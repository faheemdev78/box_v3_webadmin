'use client'
import React from 'react'
import type { CSSProperties } from 'react'
import { parseStylesOutput } from '../../lib'
import type { ComposerItem } from '../types'

export type TextValues = {
    value?: string
    color?: string
}

export function TextBlockPreview({ item, className, emptyLabel }: {
    item: ComposerItem<TextValues>
    className?: string
    emptyLabel: string
}) {
    const style = {
        ...(parseStylesOutput(item?.styles || {}) as CSSProperties),
        color: item?.values?.color || '#000000',
    }

    return (
        <div className={className} style={style}>
            {item?.values?.value
                ? item.values.value
                : <span style={{ color: '#999' }}>{emptyLabel}</span>}
        </div>
    )
}
