import type { ComponentType } from 'react'

export type ComposerField = {
    key: string
    label: string
    type: 'switch' | 'text' | 'number' | 'select' | 'color'
    options?: { label: string; value: string }[]
}

export type ComposerCategory = 'ui_elements' | 'text' | 'products' | 'carousel' | 'categories' | 'animations'

export type ComposerItem<V = Record<string, unknown>> = {
    name?: string
    data?: { type?: string; label?: string; desc?: string }
    values?: V
    styles?: unknown
    status?: string
    schedule_start?: unknown
    schedule_end?: unknown
    sort_order?: number
}

export type ComposerComponent<V = Record<string, unknown>> = {
    type: string
    label: string
    desc: string
    category: ComposerCategory
    placement: 'chrome' | 'body'
    singleton?: boolean
    defaults: V
    fields: ComposerField[]
    fieldsTitle?: string
    Preview: ComponentType<{ item: ComposerItem<V> }>
    Props?: ComponentType<{ item: ComposerItem<V> }>
    serialize?: (values: V | undefined) => unknown
}

export type ComposerDragItem<V = Record<string, unknown>> = {
    type: string
    label: string
    desc: string
    placement: 'chrome' | 'body'
    singleton: boolean
    defaults: V
}
