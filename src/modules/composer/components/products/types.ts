import type { ReactNode } from 'react'

export interface ComposerProduct {
    _id?: string
    title?: string
    picture?: { thumbnails?: string[] } | null
    attributes?: { val?: ReactNode; title?: ReactNode }[] | null
    price?: number | null
    price_was?: number | null
}

export interface ProductListValues {
    title?: { show?: boolean; text?: string }
    all_btn?: { show?: boolean; link?: string }
    num_products?: number | string
    columns?: number | string
    rows?: number | string
    gutter?: number | string
    theme?: string
    products?: ComposerProduct[]
    open_as?: string
}

export function gutterPx(value: unknown, fallback = 8) {
    if (value === undefined || value === null || value === '') return fallback
    const count = Number(value)
    if (!Number.isFinite(count) || count < 0) return fallback
    return Math.min(80, Math.floor(count))
}

function gridCount(value: unknown, fallback: number, max: number) {
    const count = Number(value)
    if (!Number.isFinite(count) || count < 1) return fallback
    return Math.min(max, Math.floor(count))
}

export function productGrid(values?: ProductListValues | null) {
    const hasColumns = values?.columns !== undefined && values?.columns !== null && values?.columns !== ''
    const hasRows = values?.rows !== undefined && values?.rows !== null && values?.rows !== ''
    if (!hasColumns && !hasRows) {
        return Number(values?.num_products) === 6 ? { columns: 3, rows: 2 } : { columns: 3, rows: 1 }
    }
    return {
        columns: gridCount(values?.columns, 3, 6),
        rows: gridCount(values?.rows, 1, 4),
    }
}
