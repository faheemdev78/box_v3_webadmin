'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBagShopping, faClipboardList, faHouse, faTableCells } from '@fortawesome/free-solid-svg-icons'
import { FormField } from '@/components/form'
import { Card } from 'antd'
import { Heading } from '../../../typography'
import type { ComposerComponent, ComposerItem } from '../../types'

export type TabBarValues = {
    show?: boolean
}

const tabs = [
    { label: 'Home', icon: faHouse, active: true },
    { label: 'Order Again', icon: faBagShopping, active: false },
    { label: 'Categories', icon: faTableCells, active: false },
    { label: 'Lists', icon: faClipboardList, active: false },
]

function TabBarPreview({ item }: { item: ComposerItem<TabBarValues> }) {
    if (item?.values?.show === false) {
        return <div style={{ padding: 16, color: '#999', fontWeight: 500 }}>Tab bar hidden</div>
    }

    return (
        <div style={{ background: '#F4F5F7', padding: '36px 12px 14px' }}>
            <div style={{
                display: 'flex',
                background: '#FFFFFF',
                borderRadius: 28,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
                padding: '10px 4px 8px',
            }}>
                {tabs.map((tab) => {
                    const color = tab.active ? '#60a52c' : '#8A8F98'
                    return (
                        <div key={tab.label} style={{ flex: 1, textAlign: 'center', color, fontSize: 11, fontWeight: tab.active ? 700 : 500, lineHeight: '14px' }}>
                            <FontAwesomeIcon icon={tab.icon} style={{ fontSize: 18, marginBottom: 4 }} />
                            <div>{tab.label}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function TabBarProps({ item }: { item: ComposerItem<TabBarValues> }) {
    return (
        <Card styles={{ body: { padding: '10px' } }}>
            <Heading style={{}}>Tab bar</Heading>
            <FormField name={`${item.name}.values.show`} type="switch" label="Show on this page" />
        </Card>
    )
}

export const tabBarComponent: ComposerComponent<TabBarValues> = {
    type: 'tab_bar',
    label: 'Tab bar',
    desc: 'Floating bottom tabs',
    category: 'ui_elements',
    placement: 'chrome',
    singleton: true,
    defaults: { show: true },
    fieldsTitle: 'Tab bar',
    fields: [
        { key: 'show', label: 'Show on this page', type: 'switch' },
    ],
    Preview: TabBarPreview,
    Props: TabBarProps,
    serialize: (values) => ({
        show: values?.show === true,
    }),
}
