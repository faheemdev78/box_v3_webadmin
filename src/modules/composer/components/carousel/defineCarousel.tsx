import type { ComposerComponent } from '../types'
import { CarouselPreview } from './CarouselPreview'
import { CarouselProps } from './CarouselProps'
import type { CarouselValues } from './types'
import type { ComposerProduct } from '../products/types'
import { serializeComposerProduct } from '../products/serializeProduct'
import { productInk } from '../products/theme'

export function defineCarousel({ type, label, desc, columns, fullBleed = false }: {
    type: string
    label: string
    desc: string
    columns: number
    fullBleed?: boolean
}): ComposerComponent<CarouselValues> {
    return {
        type,
        label,
        desc,
        category: 'carousel',
        placement: 'body',
        defaults: {
            theme: '#FFFFFF',
            products: [],
        },
        fields: [],
        Preview: ({ item }) => <CarouselPreview item={item} columns={columns} fullBleed={fullBleed} />,
        Props: CarouselProps,
        serialize: (values) => ({
            theme: productInk(values?.theme),
            products: ((values?.products || []) as ComposerProduct[])
                .filter((product) => product?._id)
                .slice(0, 20)
                .map((product) => serializeComposerProduct(product)),
        }),
    }
}
