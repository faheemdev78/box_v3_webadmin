'use client'
import React from 'react'
import { Alert, Col, Row } from 'antd'
import { Button } from '@/components'
import { animationsArray, carouselArray, categoriesArray, components, productsArray, textArray, ui_elementsArray } from './components'
import styles from './Composer.module.scss'
import type { ComposerDragItem, ComposerItem } from './components/types'

const categoryGroups: { label: string; items: ComposerDragItem[] }[] = [
    { label: 'UI Elements', items: ui_elementsArray },
    { label: 'Text', items: textArray },
    { label: 'Categories', items: categoriesArray },
    { label: 'Carousel', items: carouselArray },
    { label: 'Products', items: productsArray },
    { label: 'Animations', items: animationsArray },
]

function propsTitle(item: ComposerItem) {
    const label = item?.data?.label || ''
    const category = categoryGroups.find((group) => group.items.some((entry) => entry.type === item?.data?.type))
    if (category && label) return `${category.label}: ${label}`
    return label
}

const RenderProps = ({ item }: { item: ComposerItem }) => {
    const found = components.find((component) => component.type == item.data?.type)
    if (!found) return <Alert type="error" title="Error" description="Props not defined" />
    if (!found.propsRender) return <Alert type="error" title="Error" description="Props renderer not defined" />

    const PropsRenderer = found.propsRender
    return <PropsRenderer key={`props-${item.data?.type || 'unknown'}`} item={item} />
}

export const PropsWindow = ({ item, onClose }: { item: ComposerItem; onClose: () => void }) => {
    return (
        <div style={{ width: '420px', backgroundColor: '#D0DAE5' }}>
            <div className={styles.props_view_header}>
                <Row align="middle">
                    <Col flex="auto">{propsTitle(item)}</Col>
                    <Col><Button onClick={onClose}>Close</Button></Col>
                </Row>
            </div>
            <div className={`${styles.props_view_wrapper} ${styles.custom_scroller}`}>
                <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ padding: '15px' }}><RenderProps item={item} /></div>
                </div>
            </div>
        </div>
    )
}
