import type { ComposerProduct } from '../products/types'

export interface CarouselValues {
    theme?: string
    products?: ComposerProduct[]
}

export const CAROUSEL_PRODUCT_LIMIT = 20
