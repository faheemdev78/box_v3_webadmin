'use client'
import React, { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from '@/components'
import { parseStylesOutput } from '../../lib'
import { autoplaySeconds, useAutoplay } from '../autoplay'
import { RenderProduct } from '../products/RenderProduct'
import { productInk } from '../products/theme'
import { useAppSelector } from '@/rStore/hooks'
import { getSettings } from '@/rStore/slices/systemSlice'
import type { ComposerItem } from '../types'
import type { ComposerProduct } from '../products/types'
import { gutterPx } from '../products/types'
import { carouselCount, type CarouselNavigation, type CarouselValues } from './types'
import { useGlideScroll } from './glideScroll'

function previewStyle(item: ComposerItem<CarouselValues>) {
    const style = parseStylesOutput(item.styles || {}) as CSSProperties
    if (item.status == 'offline') style.opacity = 0.5
    return style
}

function ProductCell({ product, ink, currency }: { product: ComposerProduct; ink: string; currency: string }) {
    let offPercent = 0
    if (product.price && product.price_was && product.price_was > product.price) {
        offPercent = 100 - ((product.price / product.price_was) * 100)
    }
    return <RenderProduct item={product} off_percent={offPercent} currency={currency} color={ink} />
}

export function CarouselPreview({ item, columns: fallbackColumns, rows: fallbackRows = 1, behavior = 'slides' }: {
    item: ComposerItem<CarouselValues>
    columns: number
    rows?: number
    behavior?: 'slides' | 'scroll'
}) {
    if (behavior === 'scroll') return <ScrollCarouselPreview item={item} columns={fallbackColumns} />
    return <SlideCarouselPreview item={item} columns={fallbackColumns} rows={fallbackRows} />
}

function ScrollCarouselPreview({ item, columns: fallbackColumns }: {
    item: ComposerItem<CarouselValues>
    columns: number
}) {
    const { currency } = useAppSelector(getSettings)
    const { values } = item
    const style = previewStyle(item)
    const products = (values?.products || []).filter((product) => product?._id || product?.title)
    const ink = productInk(values?.theme)
    const columns = carouselCount(values?.columns, fallbackColumns, 6)
    const gutter = gutterPx(values?.gutter)
    const navigation = (values?.navigation || 'none') as CarouselNavigation
    const { ref, scrollBy } = useGlideScroll()

    const nudge = (direction: number) => {
        const node = ref.current
        const card = node?.firstElementChild as HTMLElement | null
        const width = (card?.getBoundingClientRect().width || node?.clientWidth || 0) + gutter
        scrollBy(direction * width)
    }

    return (
        <div style={style}>
            {!products.length && <div style={{ color: ink, padding: '12px' }}>Empty carousel</div>}
            <div style={{ position: 'relative' }}>
                <div
                    ref={ref}
                    style={{
                        display: 'flex',
                        gap: gutter,
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        userSelect: 'none',
                        scrollbarWidth: 'thin',
                        overscrollBehaviorX: 'contain',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {products.map((product, index) => (
                        <div key={product._id || index} style={{ flex: `0 0 calc((100% - ${(columns - 1) * gutter}px) / ${columns})`, minWidth: 0 }}>
                            <ProductCell product={product as ComposerProduct} ink={ink} currency={currency} />
                        </div>
                    ))}
                </div>
                {navigation === 'arrows' && products.length > columns && (
                    <CarouselNavigationView navigation="arrows" page={0} pages={products.length} free onArrow={nudge} />
                )}
            </div>
        </div>
    )
}

function SlideCarouselPreview({ item, columns: fallbackColumns, rows: fallbackRows = 1 }: {
    item: ComposerItem<CarouselValues>
    columns: number
    rows?: number
}) {
    const { currency } = useAppSelector(getSettings)
    const { values } = item
    const style = previewStyle(item)
    const products = (values?.products || []).filter((product) => product?._id || product?.title)
    const ink = productInk(values?.theme)
    const columns = carouselCount(values?.columns, fallbackColumns, 6)
    const rows = carouselCount(values?.rows, fallbackRows, 4)
    const gutter = gutterPx(values?.gutter)
    const pageSize = columns * rows
    const scroller = useRef<HTMLDivElement>(null)
    const [page, setPage] = useState(0)
    const pageRef = useRef(page)
    pageRef.current = page
    const pages = products.length ? Math.ceil(products.length / pageSize) : 0
    const navigation = (values?.navigation || 'none') as CarouselNavigation
    const slides = Array.from({ length: pages }, (_, index) => products.slice(index * pageSize, (index + 1) * pageSize))

    const onScroll = () => {
        const node = scroller.current
        if (!node?.clientWidth) return
        setPage(Math.min(pages - 1, Math.max(0, Math.round(node.scrollLeft / node.clientWidth))))
    }

    const scrollToPage = (next: number) => {
        const node = scroller.current
        if (!node?.clientWidth || pages < 1) return
        const clamped = Math.min(pages - 1, Math.max(0, next))
        node.scrollTo({ left: clamped * node.clientWidth, behavior: 'smooth' })
    }

    useAutoplay(autoplaySeconds(values?.autoplay), pages > 1, page, () => {
        const node = scroller.current
        if (!node?.clientWidth || pages < 2) return
        const next = (pageRef.current + 1) % pages
        node.scrollTo({ left: next * node.clientWidth, behavior: next === 0 ? 'auto' : 'smooth' })
    })

    return (
        <div style={style}>
            {!products.length && <div style={{ color: ink, padding: '12px' }}>Empty carousel</div>}
            <div style={{ position: 'relative' }}>
                <div
                    ref={scroller}
                    onScroll={onScroll}
                    style={{ display: 'flex', overflowX: 'auto' }}
                >
                    {slides.map((slide, slideIndex) => (
                        <div key={slideIndex} style={{ flex: '0 0 100%', minWidth: '100%', display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: gutter, alignContent: 'flex-start' }}>
                            {slide.map((product, index) => (
                                <div key={product._id || index}>
                                    <ProductCell product={product as ComposerProduct} ink={ink} currency={currency} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {navigation !== 'none' && pages > 0 && (
                    <CarouselNavigationView navigation={navigation} page={page} pages={pages} onArrow={scrollToPage} />
                )}
            </div>
        </div>
    )
}

function CarouselNavigationView({ navigation, page, pages, onArrow, free = false }: {
    navigation: CarouselNavigation
    page: number
    pages: number
    onArrow: (page: number) => void
    free?: boolean
}) {
    if (navigation === 'arrows') {
        const button = (side: 'left' | 'right'): CSSProperties => ({
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            [side]: 6,
            width: 32,
            height: 32,
            border: 0,
            background: 'transparent',
            color: 'rgba(255,255,255,0.85)',
            cursor: 'pointer',
            zIndex: 2,
        })
        return (
            <>
                <button type="button" aria-label="Previous" style={button('left')} onClick={() => onArrow(free ? -1 : Math.max(0, page - 1))}>
                    <Icon icon="arrow-left" />
                </button>
                <button type="button" aria-label="Next" style={button('right')} onClick={() => onArrow(free ? 1 : Math.min(pages - 1, page + 1))}>
                    <Icon icon="arrow-right" />
                </button>
            </>
        )
    }

    const mark = (active: boolean): CSSProperties => navigation === 'dashes'
        ? { width: 10, height: 5, borderRadius: 1, background: active ? '#fff' : 'rgba(255,255,255,0.45)', boxShadow: '0 0 2px rgba(0,0,0,0.65)' }
        : { width: 6, height: 6, borderRadius: 6, background: active ? '#fff' : 'rgba(255,255,255,0.45)', boxShadow: '0 0 2px rgba(0,0,0,0.65)' }

    return (
        <div style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', gap: 4, pointerEvents: 'none', zIndex: 2 }}>
            {Array.from({ length: pages }, (_, index) => <span key={index} style={mark(index === page)} />)}
        </div>
    )
}
