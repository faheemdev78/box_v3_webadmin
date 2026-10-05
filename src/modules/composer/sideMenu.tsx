'use client'
import React, { useState, useRef } from 'react'
import { useDrag } from 'ahooks'
import { Col, Row, Space } from 'antd'
import { Button } from '@/components'
import { ui_elementsArray, textArray, categoriesArray, carouselArray, productsArray, animationsArray } from './components'
import styles from './Composer.module.scss'
import type { ComposerDragItem } from './components/types'

const menus: Record<string, ComposerDragItem[]> = {
    ui_elements: ui_elementsArray,
    text: textArray,
    categories: categoriesArray,
    carousel: carouselArray,
    products: productsArray,
    animations: animationsArray,
}

const menuItems: { key: string; label: string }[] = [
    { key: 'ui_elements', label: 'UI Elements' },
    { key: 'text', label: 'Text' },
    { key: 'categories', label: 'Categories' },
    { key: 'carousel', label: 'Carousel' },
    { key: 'products', label: 'Products' },
    { key: 'animations', label: 'Animations' },
]

// Keep the open parent on the same primary blue through hover/active.
const selectedMenuStyle = {
    '--ant-btn-bg-color-hover': 'var(--ant-btn-bg-color)',
    '--ant-btn-bg-color-active': 'var(--ant-btn-bg-color)',
    '--ant-btn-text-color-hover': 'var(--ant-btn-text-color)',
    '--ant-btn-text-color-active': 'var(--ant-btn-text-color)',
    '--ant-btn-border-color-hover': 'var(--ant-btn-border-color)',
    '--ant-btn-border-color-active': 'var(--ant-btn-border-color)',
} as React.CSSProperties

const DragItem = ({ data }: { data: ComposerDragItem }) => {
    const dragRef = useRef(null)
    const [dragging, setDragging] = useState(false)

    useDrag(data, dragRef, {
        onDragStart: () => {
            setDragging(true)
        },
        onDragEnd: () => {
            setDragging(false)
        },
    })

    return (
        <div className={`${styles.dragItem} ${dragging ? styles.dragging : ''}`} ref={dragRef}>
            <div>{data.label}</div>
            <div style={{ fontSize: '10px' }}>{data.desc}</div>
        </div>
    )
}

export function SideMenu() {
    const [selectedMenu, set_selectedMenu] = useState<string | null>(null)
    const itemArray = selectedMenu ? menus[selectedMenu] : null

    return (
        <div className={`${styles.modules_list_wrapper} ${styles.custom_scroller}`}>
            <Row className="nowrap" style={{ height: 'inherit' }}>
                <Col style={{ borderRight: '1px solid #D0DAE5', padding: '10px', height: 'inherit' }}><div>
                    <Space orientation="vertical">
                        {menuItems.map((item) => {
                            const selected = selectedMenu === item.key
                            return (
                                <Button
                                    key={item.key}
                                    block
                                    color={selected ? 'primary' : 'default'}
                                    variant={selected ? 'solid' : 'outlined'}
                                    style={selected ? selectedMenuStyle : undefined}
                                    onClick={() => set_selectedMenu(item.key)}
                                >
                                    {item.label}
                                </Button>
                            )
                        })}
                    </Space>
                </div></Col>

                {itemArray && <Col style={{ borderRight: '1px solid #D0DAE5', width: '400px' }}>
                    <div style={{ padding: '5px 5px', borderBottom: '1px solid #D0DAE5' }}>
                        <Row align="middle">
                            <Col flex="auto"><h3 style={{ textTransform: 'uppercase' }}>{selectedMenu}</h3></Col>
                            <Col><Button onClick={() => set_selectedMenu(null)}>Close</Button></Col>
                        </Row>
                    </div>

                    <div style={{ padding: '10px' }}>
                        <Space wrap size={10}>
                            {itemArray.map((item) => (<DragItem key={item.type} data={item} />))}
                        </Space>
                    </div>
                </Col>}
            </Row>
        </div>
    )
}
