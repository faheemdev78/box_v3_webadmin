'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Card, Col, Modal, Row, Space, message } from 'antd'
import { useForm, useFormState } from 'react-final-form'
import get from 'lodash/get'
import { Button, Image } from '@/components'
import { CategoryIcon } from '@/modules/categories/IconSelect'
import { FormField } from '@/components/form'
import { publishStatus } from '@/configs'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import { Heading } from '../../../typography'
import { ComponentSchedule, ComponentStyling } from '../../../lib'
import { GalleryPanel } from '../../../gallery/GalleryPanel'
import { uploadGalleryFiles, type GalleryAsset } from '../../../gallery/uploadGalleryFile'
import type { ComposerItem } from '../../types'
import { CategorySelectModal } from './CategorySelectModal'
import { categoryGrid, categorySlots, type CategoryListValues, type CategoryPicture, type CategoryTile } from './types'

function pictureOf(asset: GalleryAsset): CategoryPicture {
    return {
        _id: asset._id,
        url: asset.url,
        name: asset.name || '',
        thumbnails: asset.thumbnails || [],
    }
}

export function CategoryListProps({ item, useCategoryIcons = false, entity = 'category' }: { item: ComposerItem<CategoryListValues>; useCategoryIcons?: boolean; entity?: 'category' | 'brand' | 'page' }) {
    const { name } = item
    const selectionKey = entity === 'page' ? 'pages' : entity === 'brand' ? 'brands' : 'categories'
    const form = useForm<Record<string, unknown>>()
    const formValues = useFormState({ subscription: { values: true } }).values
    const listValues = get(formValues, `${name}.values`) as CategoryListValues | undefined
    const pageId = formValues?._id as string | undefined
    const grid = categoryGrid(listValues)
    const limit = categorySlots(listValues)
    const categories = (listValues?.[selectionKey] || []).filter((entry) => entry?._id).slice(0, limit)
    const [openCats, setOpenCats] = useState(false)
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
    const [busyIndex, setBusyIndex] = useState<number | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const uploadIndex = useRef<number | null>(null)

    useEffect(() => {
        const current = get(form.getState().values, `${name}.values.${selectionKey}`)
        if (Array.isArray(current)) return
        form.change(`${name}.values.${selectionKey}`, [])
    }, [form, name, selectionKey])

    const setPicture = (index: number, picture: CategoryPicture | null) => {
        const current = ((get(form.getState().values, `${name}.values.${selectionKey}`) || []) as CategoryTile[]).slice()
        if (!current[index]?._id) return
        current[index] = { ...current[index], picture }
        form.change(`${name}.values.${selectionKey}`, current)
    }

    const upload = async (file?: File | null) => {
        const index = uploadIndex.current
        if (index == null || !file || !pageId) return
        if (!file.type.startsWith('image/')) {
            message.error('Choose a picture.')
            return
        }
        setBusyIndex(index)
        try {
            const saved = await uploadGalleryFiles([file], pageId)
            if (saved[0]) setPicture(index, pictureOf(saved[0]))
        } catch (error: any) {
            message.error(error?.message || 'Upload failed.')
        } finally {
            setBusyIndex(null)
            uploadIndex.current = null
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (<>
        <Space orientation="vertical" style={{ width: '100%' }}>
            <FormField name={`${name}.status`} type="select" label="Status" options={publishStatus} />

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Title</Heading>
                <Row gutter={5} align="bottom">
                    <Col flex="auto"><FormField name={`${name}.values.title.text`} type="text" label="Section title" /></Col>
                    <Col>
                        <FormField
                            wrapperStyle={{ paddingBottom: '5px' }}
                            name={`${name}.values.title.show`}
                            type="switch"
                            defaultChecked
                            checkedChildren="Show"
                            unCheckedChildren="Hide"
                        />
                    </Col>
                </Row>
            </Card>

            {/* <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Theme</Heading>
                <FormField name={`${name}.values.theme`} type="color" label="Text color" />
            </Card> */}

            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Layout</Heading>
                <Space orientation='horizontal'>
                    <FormField name={`${name}.values.theme`} type="color" label="Text" />
                    <FormField name={`${name}.values.columns`} type="number" label="Columns" min={1} max={6} />
                    <FormField name={`${name}.values.rows`} type="number" label="Rows" min={1} max={4} />
                    <FormField name={`${name}.values.gutter`} type="number" label="Gutter" min={0} max={80} />
                </Space>

                <div style={{ marginTop: 8 }}>
                    <FormField
                        name={`${name}.values.show_title`}
                        type="switch"
                        label={entity === 'page' ? 'Page title' : entity === 'brand' ? 'Brand title' : 'Category title'}
                        defaultChecked
                        checkedChildren="Show"
                        unCheckedChildren="Hide"
                    />
                </div>
                <div style={{ color: '#666', margin: '8px 0' }}>{grid.columns} columns × {grid.rows} rows. {useCategoryIcons ? `Icons come from the selected ${selectionKey}.` : 'Each picture fills its column.'}</div>
                <Button htmlType="button" onClick={() => setOpenCats(true)}>Choose {selectionKey}</Button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
                    {Array.from({ length: limit }, (_, index) => {
                        const entry = categories[index]
                        const src = entry?.picture?.thumbnails?.[0] || entry?.picture?.url || ''
                        return (
                            <div key={entry?._id || `empty-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 8 }}>
                                <div style={{ height: 72, borderRadius: 8, background: '#F3F6F4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {useCategoryIcons && entry && (entry.icon || entry.icon_img || entry.icon_img_thumb)
                                        ? <CategoryIcon name={entry.icon} iconImg={cdnImageUrl(entry.icon_img_thumb || entry.icon_img || '') || undefined} size={48} color={listValues?.theme || '#222222'} />
                                        : !useCategoryIcons && src
                                        ? <Image src={cdnImageUrl(src)} width={120} height={72} alt={entry?.title || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        : <span style={{ color: '#99a' }}>{entry ? (useCategoryIcons ? `No ${entity} icon` : 'No picture') : 'Empty'}</span>}
                                </div>
                                <div style={{ marginTop: 6, minHeight: 18, fontSize: 12 }}>{entry?.title || ' '}</div>
                                {!useCategoryIcons && entry?._id && (
                                    <Space size={4} style={{ marginTop: 4 }}>
                                        <Button htmlType="button" size="small" onClick={() => { uploadIndex.current = index; fileRef.current?.click() }} loading={busyIndex === index}>Upload</Button>
                                        <Button htmlType="button" size="small" onClick={() => setGalleryIndex(index)}>Gallery</Button>
                                    </Space>
                                )}
                            </div>
                        )
                    })}
                </div>
            </Card>

            <ComponentStyling name={name} />
            <ComponentSchedule name={name} />
        </Space>

        {!useCategoryIcons && <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => upload(event.target.files?.[0])}
        />}

        <CategorySelectModal
            entity={entity}
            open={openCats}
            onClose={() => setOpenCats(false)}
            fieldName={`${name}.values.${selectionKey}`}
            limit={limit}
        />

        {!useCategoryIcons && <Modal title="Choose a picture" open={galleryIndex != null} onCancel={() => setGalleryIndex(null)} footer={null} width={720} destroyOnHidden>
            {galleryIndex != null && (
                <GalleryPanel
                    pageId={pageId}
                    kind="picture"
                    selectable
                    selectLabel="Use"
                    onSelect={(asset) => {
                        setPicture(galleryIndex, pictureOf(asset))
                        setGalleryIndex(null)
                    }}
                />
            )}
        </Modal>}
    </>)
}
