export interface CategoryPicture {
    _id?: string
    url?: string
    name?: string
    thumbnails?: string[]
}

export interface CategoryTile {
    _id?: string
    title?: string
    slug?: string
    icon?: string | null
    icon_img?: string | null
    icon_img_thumb?: string | null
    picture?: CategoryPicture | null
}

export interface CategoryListValues {
    title?: { show?: boolean; text?: string }
    show_title?: boolean
    columns?: number | string
    rows?: number | string
    gutter?: number | string
    theme?: string
    categories?: CategoryTile[]
    brands?: CategoryTile[]
    pages?: CategoryTile[]
}

export function gutterPx(value: unknown, fallback = 12) {
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

export function categoryGrid(values?: CategoryListValues | null) {
    return {
        columns: gridCount(values?.columns, 4, 6),
        rows: gridCount(values?.rows, 2, 4),
    }
}

export function categorySlots(values?: CategoryListValues | null) {
    const grid = categoryGrid(values)
    return grid.columns * grid.rows
}
