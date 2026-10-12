'use client'

import { useState } from 'react'
import { Alert, Button, Empty, Space } from 'antd'
import { useForm } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import cloneDeep from 'lodash/cloneDeep'
import type { ComposerItem } from '../components/types'
import { storePageComponent, storePageComponents } from './registry'
import styles from './StorePageComposer.module.scss'

type StoreRow = ComposerItem<any> & { id: string; _id?: string }

export function StorePageComposer({ onDeleteRow }: {
    onDeleteRow: (row: StoreRow, callback: () => void) => Promise<boolean>
}) {
    const form = useForm()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)

    return <FieldArray name="rows">
        {({ fields }) => {
            const rows: StoreRow[] = fields.value || []
            const selectedIndex = rows.findIndex((row) => row.id === selectedId)
            const selected = rows[selectedIndex]
            const definition = storePageComponent(selected?.data?.type)
            const Props = definition?.Props

            return <div className={styles.composer}>
                <aside className={styles.sidebar}>
                    <h3>Store components</h3>
                    <p>Add a component, then configure it.</p>
                    {storePageComponents.map((component) => <Button
                        key={component.type}
                        block
                        onClick={() => {
                            const id = crypto.randomUUID()
                            fields.push({
                                id,
                                data: { type: component.type, label: component.label, desc: component.desc },
                                values: cloneDeep(component.defaults),
                                status: 'online',
                            })
                            setSelectedId(id)
                        }}
                    >+ {component.label}</Button>)}
                </aside>

                <main className={styles.workspace}>
                    <div className={styles.heading}>
                        <h3>Store Page</h3>
                        <p>Category: {String((form.getState().values as any)?.page_type?.page_source?.title || '')}</p>
                    </div>
                    {!rows.length && <Empty description="Add a Picture Banner to configure your store page." />}
                    {fields.map((name, index) => {
                        const row = rows[index]
                        const component = storePageComponent(row.data?.type)
                        const Preview = component?.Preview

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
                                                const currentIndex = (fields.value || []).findIndex((entry: StoreRow) => entry.id === row.id)
                                                if (currentIndex >= 0) fields.remove(currentIndex)
                                                if (selectedId === row.id) setSelectedId(null)
                                            })
                                        } finally {
                                            setRemovingId(null)
                                        }
                                    }}>Remove</Button>
                                </Space>
                            </div>
                            <div className={styles.preview}>
                                {Preview
                                    ? <Preview item={{ ...row, name }} />
                                    : <Alert type="error" title={`Unsupported store component: ${row.data?.type || 'empty'}`} />}
                            </div>
                        </section>
                    })}
                </main>

                {selected && <aside className={styles.configuration}>
                    <div className={styles.componentHeader}>
                        <strong>{definition?.label || 'Component settings'}</strong>
                        <Button size="small" onClick={() => setSelectedId(null)}>Close</Button>
                    </div>
                    <div className={styles.properties}>
                        {Props ? <Props key={selected.id} item={{ ...selected, name: `rows[${selectedIndex}]` }} /> : <Alert type="error" title="Store component settings unavailable" />}
                    </div>
                </aside>}
            </div>
        }}
    </FieldArray>
}
