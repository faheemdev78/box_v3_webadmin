import type { ComposerProduct } from '../products/types'

export type CarouselNavigation = 'none' | 'dots' | 'dashes' | 'arrows'

export interface CarouselValues {
    theme?: string
    navigation?: CarouselNavigation
    products?: ComposerProduct[]
}

export const CAROUSEL_PRODUCT_LIMIT = 20
