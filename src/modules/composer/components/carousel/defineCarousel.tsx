import type { ComposerComponent } from '../types'
import { CarouselPreview } from './CarouselPreview'
import { CarouselProps } from './CarouselProps'
import { carouselCount, type CarouselNavigation, type CarouselValues } from './types'
import { gutterPx, type ComposerProduct } from '../products/types'
import { serializeComposerProduct } from '../products/serializeProduct'
import { productInk } from '../products/theme'

export function defineCarousel({ type, label, desc, columns, rows = 1 }: {
    type: string
    label: string
    desc: string
    columns: number
    rows?: number
}): ComposerComponent<CarouselValues> {
    return {
        type,
        label,
        desc,
        category: 'carousel',
        placement: 'body',
        defaults: {
            theme: '#FFFFFF',
            navigation: 'none',
            columns,
            rows,
            gutter: 8,
            products: [],
        },
        fields: [],
        Preview: ({ item }) => <CarouselPreview item={item} columns={columns} rows={rows} />,
        Props: CarouselProps,
        serialize: (values) => ({
            theme: productInk(values?.theme),
            navigation: (['dots', 'dashes', 'arrows'].includes(values?.navigation || '') ? values?.navigation : 'none') as CarouselNavigation,
            columns: carouselCount(values?.columns, columns, 6),
            rows: carouselCount(values?.rows, rows, 4),
            gutter: gutterPx(values?.gutter),
            products: ((values?.products || []) as ComposerProduct[])
                .filter((product) => product?._id)
                .slice(0, 20)
                .map((product) => serializeComposerProduct(product)),
        }),
    }
}
