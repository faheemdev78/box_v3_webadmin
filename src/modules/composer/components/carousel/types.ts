import type { ComposerProduct } from '../products/types'

export type CarouselNavigation = 'none' | 'dots' | 'dashes' | 'arrows'

export interface CarouselValues {
    theme?: string
    navigation?: CarouselNavigation
    autoplay?: number
    columns?: number
    rows?: number
    gutter?: number | string
    products?: ComposerProduct[]
}

export function carouselCount(value: unknown, fallback: number, max: number) {
    const count = Number(value)
    if (!Number.isFinite(count) || count < 1) return fallback
    return Math.min(max, Math.floor(count))
}

export const CAROUSEL_PRODUCT_LIMIT = 20
