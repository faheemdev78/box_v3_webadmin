'use client'
import React from 'react'
import type { ComposerComponent, ComposerItem } from '../../types'
import { BlockProps } from '../BlockProps'
import { canvasShell } from '../blockFrame'

function HorizontalLinePreview({ item }: { item: ComposerItem }) {
    return (
        <div style={canvasShell(item)}>
            <hr style={{ width: '100%', border: 0, borderTop: '1px solid #8AA0B8', margin: 0 }} />
        </div>
    )
}

function HorizontalLineProps({ item }: { item: ComposerItem }) {
    return <BlockProps item={item} />
}

export const horizontalLineComponent: ComposerComponent = {
    type: 'horizontal_line',
    label: 'Horizontal Line',
    desc: 'A plain horizontal line',
    category: 'ui_elements',
    placement: 'body',
    defaults: {},
    fields: [],
    Preview: HorizontalLinePreview,
    Props: HorizontalLineProps,
}
