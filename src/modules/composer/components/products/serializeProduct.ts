import type { ComposerProduct } from './types'

type StoreFields = {
    price?: number | null
    price_was?: number | null
    status?: string
    available_qty?: number
    store_status?: string
    __typename?: string
}

type ProductSource = ComposerProduct & {
    store?: StoreFields | null
    __typename?: string
}

function withoutTypename<T extends { __typename?: string }>(value: T | null | undefined) {
    if (!value) return value
    const { __typename, ...rest } = value
    return rest
}

export function serializeComposerProduct(product?: ProductSource | null): ComposerProduct {
    if (!product?._id) return {}

    const store = withoutTypename(product.store) as StoreFields | null | undefined
    const picture = withoutTypename(product.picture as { thumbnails?: string[]; __typename?: string } | null | undefined)

    return {
        ...withoutTypename(product),
        picture,
        store,
        price: product.price ?? store?.price ?? null,
        price_was: product.price_was ?? store?.price_was ?? null,
    } as ComposerProduct
}
