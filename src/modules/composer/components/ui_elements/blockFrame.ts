import type { CSSProperties } from 'react'
import { parseStylesOutput } from '../../lib'
import type { ComposerItem } from '../types'

export function blockFrame(item: ComposerItem): CSSProperties {
    const style = parseStylesOutput(item?.styles || {}) as CSSProperties
    if (item?.status === 'offline') style.opacity = 0.5
    return style
}

export function canvasShell(item: ComposerItem, style?: CSSProperties): CSSProperties {
    return {
        ...blockFrame(item),
        minHeight: 40,
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        ...style,
    }
}
