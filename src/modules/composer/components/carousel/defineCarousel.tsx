import { autoplaySeconds } from '../autoplay'
import type { ComposerComponent } from '../types'
import { CarouselPreview } from './CarouselPreview'
import { CarouselProps } from './CarouselProps'
import { carouselCount, type CarouselNavigation, type CarouselValues } from './types'
import { gutterPx, type ComposerProduct } from '../products/types'
import { serializeComposerProduct } from '../products/serializeProduct'
import { productInk } from '../products/theme'

export function defineCarousel({ type, label, desc, columns, rows = 1, behavior = 'slides' }: {
    type: string
    label: string
    desc: string
    columns: number
    rows?: number
    behavior?: 'slides' | 'scroll'
}): ComposerComponent<CarouselValues> {
    const scrolling = behavior === 'scroll'
    return {
        type,
        label,
        desc,
        category: 'carousel',
        placement: 'body',
        defaults: {
            theme: '#FFFFFF',
            navigation: 'none',
            autoplay: 0,
            columns,
            rows: scrolling ? 1 : rows,
            gutter: 8,
            products: [],
        },
        fields: [],
        Preview: ({ item }) => <CarouselPreview item={item} columns={columns} rows={rows} behavior={behavior} />,
        Props: CarouselProps,
        serialize: (values) => ({
            theme: productInk(values?.theme),
            navigation: (['dots', 'dashes', 'arrows'].includes(values?.navigation || '') ? values?.navigation : 'none') as CarouselNavigation,
            autoplay: scrolling ? 0 : autoplaySeconds(values?.autoplay),
            columns: carouselCount(values?.columns, columns, 6),
            rows: scrolling ? 1 : carouselCount(values?.rows, rows, 4),
            gutter: gutterPx(values?.gutter),
            products: ((values?.products || []) as ComposerProduct[])
                .filter((product) => product?._id)
                .slice(0, 20)
                .map((product) => serializeComposerProduct(product)),
        }),
    }
}
