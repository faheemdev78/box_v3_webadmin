'use client'
import React from 'react'
import type { CSSProperties } from 'react'
import { parseStylesOutput } from '../../lib'
import { RenderProduct } from '../products/RenderProduct'
import { productInk } from '../products/theme'
import { useAppSelector } from '@/rStore/hooks'
import { getSettings } from '@/rStore/slices/systemSlice'
import type { ComposerItem } from '../types'
import type { ComposerProduct } from '../products/types'
import type { CarouselValues } from './types'

export function CarouselPreview({ item, columns, fullBleed = false }: {
    item: ComposerItem<CarouselValues>
    columns: number
    fullBleed?: boolean
}) {
    const { currency } = useAppSelector(getSettings)
    const { values, styles, status } = item
    const style = parseStylesOutput(styles || {}) as CSSProperties
    if (status == 'offline') Object.assign(style, { opacity: 0.5 })

    const products = (values?.products || []).filter((product) => product?._id || product?.title)
    const ink = productInk(values?.theme)
    const width = `${100 / columns}%`

    return (
        <div style={style}>
            {!products.length && <div style={{ color: ink, padding: '12px' }}>Empty carousel</div>}
            <div style={{ display: 'flex', overflowX: 'auto', paddingLeft: fullBleed ? 0 : 8, paddingRight: fullBleed ? 0 : 8 }}>
                {products.map((product, index) => {
                    let offPercent = 0
                    if (product.price && product.price_was && product.price_was > product.price) {
                        offPercent = 100 - ((product.price / product.price_was) * 100)
                    }
                    return (
                        <div key={product._id || index} style={{ flex: `0 0 ${width}`, minWidth: width }}>
                            <RenderProduct item={product as ComposerProduct} off_percent={offPercent} currency={currency} color={ink} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
