'use client'
import React from 'react'
import type { CSSProperties } from 'react'
import { Space } from 'antd'
import { Icon } from '@/components'
import { CategoryIcon } from '@/modules/categories/IconSelect'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import { parseStylesOutput } from '../../../lib'
import { productInk } from '../../products/theme'
import cssStyles from '../../products/productList.module.scss'
import type { ComposerItem } from '../../types'
import { categoryGrid, categorySlots, gutterPx, type CategoryListValues, type CategoryTile } from './types'

function tilePicture(item?: CategoryTile | null) {
    return item?.picture?.thumbnails?.[0] || item?.picture?.url || ''
}

export function CategoryListPreview({ item, useCategoryIcons = false, entity = 'category' }: { item: ComposerItem<CategoryListValues>; useCategoryIcons?: boolean; entity?: 'category' | 'brand' | 'page' }) {
    const { schedule_start, schedule_end, values, styles, status } = item
    const style = parseStylesOutput(styles || {}) as CSSProperties
    if (status == 'offline') Object.assign(style, { opacity: 0.5 })

    const grid = categoryGrid(values)
    const limit = categorySlots(values)
    const saved = (values?.[entity === 'page' ? 'pages' : entity === 'brand' ? 'brands' : 'categories'] || []).filter((entry) => entry?._id).slice(0, limit)
    const tiles: CategoryTile[] = Array.from({ length: limit }, (_, index) => saved[index] || {})
    const ink = values?.theme ? productInk(values.theme) : '#222222'
    const showTitle = values?.show_title !== false
    const isScheduled = Boolean(schedule_start || schedule_end)

    return (
        <div className={cssStyles.comp_prod_list} style={style}>
            <div className={cssStyles.feature_icons}><Space orientation="vertical" size={2}>
                {isScheduled && <Icon icon="clock" />}
            </Space></div>
            {values?.title?.show && values.title.text && <h2 style={{ color: ink, margin: '0 0 10px' }}>{values.title.text}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`, gap: gutterPx(values?.gutter) }}>
                {tiles.map((entry, index) => {
                    const src = tilePicture(entry)
                    return (
                        <div key={entry._id || index}>
                            <div className={cssStyles.icon_wrapper}>
                                {useCategoryIcons
                                    ? <CategoryIcon name={entry.icon} iconImg={cdnImageUrl(entry.icon_img_thumb || entry.icon_img || '') || undefined} size={48} color={ink} />
                                    : src
                                    ? <img src={cdnImageUrl(src)} alt={entry.title || ''} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    : null}
                            </div>
                            {showTitle && entry.title && (
                                <div style={{ marginTop: 6, textAlign: 'center', color: ink, fontSize: 13, lineHeight: 1.25 }}>{entry.title}</div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
