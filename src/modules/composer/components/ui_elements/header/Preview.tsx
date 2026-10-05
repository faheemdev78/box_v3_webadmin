'use client'
import React from 'react'
import { Avatar, Col, Row, Space } from 'antd'
import { parseStylesOutput } from '../../../lib'
import cssStyles from '../Header.module.scss'
import { Icon, Image } from '@/components'
import type { ComposerItem } from '../../types'
import { productInk } from '../../products/theme'

type HeaderValues = {
    theme?: string
    logo?: 'white' | 'green'
    top_bar?: boolean
    address_bar?: boolean
    search_bar?: boolean
    cat_bar?: boolean
}

const logos = {
    white: '/images/box_white.png',
    green: '/images/box_green.png',
}

function logoSrc(logo?: string, theme?: string) {
    if (logo === 'green' || logo === 'white') return logos[logo]
    return theme === 'green' ? logos.green : logos.white
}

function TopBar({ logo, theme }: { logo?: string; theme?: string }) {
    const src = logoSrc(logo, theme)
    return (
        <div className={cssStyles.bar}>
            <Row align="middle">
                <Col flex="auto"><Image src={src} width={100} height={32} alt="logo" style={{ objectFit: 'contain', width: 100, height: 32 }} /></Col>
                <Col><Avatar /></Col>
            </Row>
        </div>
    )
}

function AddressBar({ color }: { color: string }) {
    return (
        <div className={cssStyles.address_bar} style={{ color, lineHeight: '20px' }}>
            <Row align={'middle'}>
                <Col>Your address here</Col>
                <Col><Icon icon='angle-down' color={color} /></Col>
            </Row>
        </div>
    )
}

function SearchBar() {
    return (
        <div className={cssStyles.bar}>
            <div className={cssStyles.search_bar}>Search bar</div>
        </div>
    )
}

function CatBar({ color }: { color: string }) {
    return (
        <div className={cssStyles.bar}>
            <Space>
                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                    <div className={cssStyles.cat} key={item} style={{ color, borderColor: color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '14px' }}>
                        <Icon icon="shopping-bag" color={color} />
                        <div>Cat {item}</div>
                    </div>
                ))}
            </Space>
        </div>
    )
}

export function HeaderPreview({ item }: { item: ComposerItem<HeaderValues> }) {
    const { values, styles } = item || {}
    const style = parseStylesOutput(styles || {}) as React.CSSProperties
    const ink = productInk(values?.theme)
    const hasBackground = Boolean(style.backgroundColor || style.backgroundImage)
    const frameStyle = hasBackground ? style : { ...style, backgroundColor: 'green' }
    const barsOn = !!(values?.top_bar || values?.address_bar || values?.search_bar || values?.cat_bar)

    return (
        <div className={cssStyles.comp_header} style={frameStyle}>
            {values?.top_bar && <TopBar logo={values?.logo} theme={values?.theme} />}
            {values?.address_bar && <AddressBar color={ink} />}
            {values?.search_bar && <SearchBar />}
            {values?.cat_bar && <CatBar color={ink} />}
            {!barsOn && <span style={{ color: '#999', fontWeight: 500 }}>Header hidden</span>}
        </div>
    )
}
