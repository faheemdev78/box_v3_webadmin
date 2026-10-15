'use client'

import { useState } from 'react'
import { Alert, Button, Space } from 'antd'
import { useForm } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import cloneDeep from 'lodash/cloneDeep'
import { nanoid } from 'nanoid'
import type { ComposerItem } from '../components/types'
import { categoryDetailPageComponent, categoryDetailPageComponents } from './registry'
import { CategoryDetailPageCanvas } from './CategoryDetailPageCanvas'
import styles from './CategoryDetailPageComposer.module.scss'

type DetailRow = ComposerItem<any> & { id: string; _id?: string }

export function CategoryDetailPageComposer({ onDeleteRow }: {
    onDeleteRow: (row: DetailRow, callback: () => void) => Promise<boolean>
}) {
    const form = useForm()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)

    return <FieldArray name="rows">
        {({ fields }) => {
            const rows: DetailRow[] = fields.value || []
            const selectedIndex = rows.findIndex((row) => row.id === selectedId)
            const selected = rows[selectedIndex]
            const definition = categoryDetailPageComponent(selected?.data?.type)
            const Props = definition?.Props

            return <div className={styles.composer}>
                <aside className={styles.sidebar}>
                    <h3>Category detail components</h3>
                    <p>Add a component, then configure it.</p>
                    {categoryDetailPageComponents.map((component) => <Button
                        key={component.type}
                        block
                        onClick={() => {
                            const id = nanoid()
                            fields.push({
                                id,
                                data: { type: component.type, label: component.label, desc: component.desc },
                                values: cloneDeep(component.defaults),
                                status: 'online',
                            })
                            setSelectedId(id)
                        }}
                    >+ {component.label}</Button>)}
                    <h4 className={styles.componentsTitle}>Page components</h4>
                    {!rows.length && <p>No banners added yet.</p>}
                    {fields.map((name, index) => {
                        const row = rows[index]
                        const component = categoryDetailPageComponent(row.data?.type)

                        return <section key={row.id} className={`${styles.component} ${selectedId === row.id ? styles.selected : ''}`}>
                            <div className={styles.componentHeader}>
                                <Button type="text" onClick={() => setSelectedId(row.id)}>{component?.label || row.data?.label || 'Unknown component'}</Button>
                                <Space>
                                    <Button size="small" disabled={index === 0} onClick={() => fields.move(index, index - 1)} aria-label="Move banner up">↑</Button>
                                    <Button size="small" disabled={index === rows.length - 1} onClick={() => fields.move(index, index + 1)} aria-label="Move banner down">↓</Button>
                                    <Button size="small" onClick={() => setSelectedId(row.id)}>Configure</Button>
                                    <Button size="small" danger loading={removingId === row.id} disabled={!!removingId} onClick={async () => {
                                        setRemovingId(row.id)
                                        try {
                                            await onDeleteRow(row, () => {
                                                const currentIndex = (fields.value || []).findIndex((entry: DetailRow) => entry.id === row.id)
                                                if (currentIndex >= 0) fields.remove(currentIndex)
                                                if (selectedId === row.id) setSelectedId(null)
                                            })
                                        } finally {
                                            setRemovingId(null)
                                        }
                                    }}>Remove</Button>
                                </Space>
                            </div>

                        </section>
                    })}
                </aside>

                <main className={styles.workspace}>
                    <div className={styles.heading}>
                        <h3>Category Detail Page canvas</h3>
                    </div>
                    <CategoryDetailPageCanvas source={form.getState().values?.page_type?.page_source}>
                        {fields.map((name, index) => {
                            const row = rows[index]
                            const component = categoryDetailPageComponent(row.data?.type)
                            const Preview = component?.Preview
                            return <div
                                key={row.id}
                                className={`${styles.canvasBanner} ${selectedId === row.id ? styles.selectedBanner : ''}`}
                                role="button"
                                tabIndex={0}
                                aria-label={`Configure ${component?.label || 'banner'} ${index + 1}`}
                                onClick={() => setSelectedId(row.id)}
                                onKeyDown={(event) => {
                                    if (event.target !== event.currentTarget) return
                                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(row.id) }
                                }}
                            >
                                {Preview ? <Preview item={{ ...row, name }} /> : <Alert type="error" title="Unsupported category detail component" />}
                            </div>
                        })}
                    </CategoryDetailPageCanvas>
                </main>

                {selected && <aside className={styles.configuration}>
                    <div className={styles.componentHeader}>
                        <strong>{definition?.label || 'Component settings'}</strong>
                        <Button size="small" onClick={() => setSelectedId(null)}>Close</Button>
                    </div>
                    <div className={styles.properties}>
                        {Props ? <Props key={selected.id} item={{ ...selected, name: `rows[${selectedIndex}]` }} /> : <Alert type="error" title="Category detail component settings unavailable" />}
                    </div>
                </aside>}
            </div>
        }}
    </FieldArray>
}
