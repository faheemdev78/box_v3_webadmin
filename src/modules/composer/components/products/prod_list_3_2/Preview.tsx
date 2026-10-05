'use client'
import React from 'react'
import type { CSSProperties } from 'react'
import { Col, Row, Space } from 'antd'
import { Button, Icon } from '@/components'
import { useAppSelector } from '@/rStore/hooks'
import { getSettings } from '@/rStore/slices/systemSlice'
import { parseStylesOutput } from '../../../lib'
import { RenderProduct } from '../RenderProduct'
import cssStyles from '../productList.module.scss'
import type { ComposerItem } from '../../types'
import type { ComposerProduct, ProductListValues } from '../types'
import { productInk } from '../theme'

export function ProdListPreview({ item }: { item: ComposerItem<ProductListValues> }) {
    const { currency } = useAppSelector(getSettings)
    const { schedule_start, schedule_end, values, styles, status } = item

    const style = parseStylesOutput(styles || {}) as CSSProperties
    if (status == 'offline') Object.assign(style, { opacity: 0.5 })

    const { num_products, products } = values || {}
    const _num_products = Number(num_products || 3)
    const isScheduled = Boolean(schedule_start || schedule_end)
    const itemsArray: ComposerProduct[] = products || new Array<ComposerProduct>(_num_products).fill({})
    const ink = productInk(values?.theme)

    return (
        <div className={cssStyles.comp_prod_list} style={style}>
            <div className={cssStyles.feature_icons}><Space orientation="vertical" size={2}>
                {isScheduled && <Icon icon="clock" />}
            </Space></div>

            {values?.title?.show && <h2 style={{ color: ink }}>{values.title.text}</h2>}

            <Row gutter={[12, 10]}>
                {itemsArray.map((product, i) => {
                    let off_percent = 0
                    if (product.price && product.price_was && product.price_was > product.price) {
                        off_percent = 100 - ((product.price / product.price_was) * 100)
                    }

                    return (
                        <Col span={8} key={i}>
                            <RenderProduct item={product} off_percent={off_percent} currency={currency} color={ink} />
                        </Col>
                    )
                })}
            </Row>

            {values?.all_btn?.show && (
                <div style={{ marginTop: '15px', textAlign: 'right' }}>
                    <Button onClick={() => console.log(values.all_btn?.link)} size="small">Show All</Button>
                </div>
            )}
        </div>
    )
}
