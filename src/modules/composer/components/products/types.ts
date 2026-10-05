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
    theme?: string
    products?: ComposerProduct[]
    open_as?: string
}
