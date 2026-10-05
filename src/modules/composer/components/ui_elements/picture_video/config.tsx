'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Card, Col, Modal, Row, Space, message } from 'antd'
import { useMutation } from '@apollo/client/react'
import { useForm } from 'react-final-form'
import get from 'lodash/get'
import { Image } from '@/components'
import { FormField } from '@/components/form'
import { Heading } from '../../../typography'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import type { ComposerComponent, ComposerItem } from '../../types'
import { BlockProps } from '../BlockProps'
import { blockFrame } from '../blockFrame'
import { AttachmentFields } from '../AttachmentFields'
import { serializeAttachment } from '../attachment'
import { GalleryPanel } from '../../../gallery/GalleryPanel'
import { uploadGalleryFile, type GalleryAsset } from '../../../gallery/uploadGalleryFile'
import SAVE_GALLERY from '@/graphql/app_page_gallery/saveAppPageGallery.graphql'

export const DEFAULT_MEDIA_HEIGHT = 220

export type MediaValues = {
    kind?: 'picture' | 'video'
    height?: number | string
    asset?: GalleryAsset | null
    assets?: GalleryAsset[]
}

export function mediaHeight(values?: MediaValues | null): number {
    const raw = Number(values?.height)
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MEDIA_HEIGHT
}

export function mediaAssets(values?: MediaValues | null): GalleryAsset[] {
    if (Array.isArray(values?.assets) && values.assets.length) {
        return values.assets.filter((asset) => asset?._id || asset?.url)
    }
    if (values?.asset?._id || values?.asset?.url) return [values.asset]
    return []
}

function MediaSlide({ asset, height }: { asset: GalleryAsset; height: number }) {
    const frame = { width: '100%', height, objectFit: 'cover' as const, display: 'block' }
    const src = asset.url ? cdnImageUrl(asset.thumbnails?.[0] || asset.url) : ''
    if (asset.kind === 'video' && asset.url) {
        return <video src={cdnImageUrl(asset.url)} controls style={{ ...frame, background: '#000' }} />
    }
    if (src) {
        return <Image src={src} width={640} height={height} alt={asset.name || 'picture'} style={frame} />
    }
    return null
}

function MediaPreview({ item }: { item: ComposerItem<MediaValues> }) {
    const assets = mediaAssets(item?.values)
    const height = mediaHeight(item?.values)
    const carousel = assets.length > 1

    return (
        <div style={blockFrame(item)}>
            {!assets.length && <div style={{ color: '#999', paddingTop: 12, paddingBottom: 12 }}>No media</div>}
            {assets.length === 1 && <MediaSlide asset={assets[0]} height={height} />}
            {carousel && (
                <div style={{ display: 'flex', overflowX: 'auto', width: '100%' }}>
                    {assets.map((asset, index) => (
                        <div key={asset._id || index} style={{ flex: '0 0 100%', minWidth: '100%' }}>
                            <MediaSlide asset={asset} height={height} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function MediaProps({ item }: { item: ComposerItem<MediaValues> }) {
    const { name } = item
    const form = useForm()
    const pageId = form.getState().values?._id as string | undefined
    const assets = mediaAssets(item?.values)
    const fileRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [saveGallery] = useMutation<any>(SAVE_GALLERY)

    const savedAssets = () => mediaAssets(get(form.getState().values, `${name}.values`) as MediaValues)

    useEffect(() => {
        const values = get(form.getState().values, `${name}.values`) as MediaValues
        if ((!values?.assets || !values.assets.length) && (values?.asset?._id || values?.asset?.url)) {
            form.change(`${name}.values.assets`, [values.asset])
            form.change(`${name}.values.asset`, null)
        }
    }, [form, name])

    const addAssets = (incoming: GalleryAsset[]) => {
        const next = savedAssets()
        const ids = new Set(next.map((asset) => asset._id).filter(Boolean))
        incoming.forEach((asset) => {
            if (asset._id && ids.has(asset._id)) return
            next.push(asset)
            if (asset._id) ids.add(asset._id)
        })
        form.change(`${name}.values.assets`, next)
        form.change(`${name}.values.asset`, null)
    }

    const removeAsset = (index: number) => {
        form.change(`${name}.values.assets`, savedAssets().filter((_, itemIndex) => itemIndex !== index))
        form.change(`${name}.values.asset`, null)
    }

    const upload = async (files?: FileList | null) => {
        if (!files?.length || !pageId) return
        const accepted = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
        if (!accepted.length) {
            message.error('Choose picture or video files.')
            return
        }

        setBusy(true)
        try {
            const saved: GalleryAsset[] = []
            for (const file of accepted) {
                const uploaded = await uploadGalleryFile(file, pageId)
                const response = await saveGallery({
                    variables: {
                        input: {
                            _id_parent: pageId,
                            kind: uploaded.kind,
                            name: uploaded.name || '',
                            url: uploaded.url,
                            path: uploaded.path || '',
                            type: uploaded.type || '',
                            thumbnails: uploaded.thumbnails || [],
                            thumb_paths: uploaded.thumb_paths || [],
                        },
                    },
                })
                const record = response?.data?.saveAppPageGallery
                if (record?.error) throw new Error(record.error.message)
                if (!record?._id) throw new Error('The gallery did not save this file.')
                saved.push(record)
            }
            addAssets(saved)
            message.success(saved.length > 1 ? `Added ${saved.length} files to the page gallery` : 'Added to the page gallery')
        } catch (error: any) {
            message.error(error?.message || 'Upload failed.')
        } finally {
            setBusy(false)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (
        <BlockProps item={item}>
            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Media</Heading>
                <FormField name={`${name}.values.height`} type="number" label="Component height" />
                <div style={{ marginTop: 8, marginBottom: 8, color: '#666' }}>
                    {assets.length > 1 ? `${assets.length} items, shown as a carousel` : `${assets.length} item`}
                </div>
                <Space>
                    <ButtonLike onClick={() => setOpen(true)}>Choose from gallery</ButtonLike>
                    <ButtonLike onClick={() => fileRef.current?.click()} disabled={busy || !pageId}>
                        {busy ? 'Uploading…' : 'Upload new'}
                    </ButtonLike>
                </Space>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={(event) => upload(event.target.files)}
                />
            </Card>

            {assets.map((asset, index) => (
                <Card key={asset._id || index} styles={{ body: { padding: '10px' } }}>
                    <Row align="middle" gutter={8}>
                        <Col flex="auto">
                            <Heading style={undefined}>{asset.kind === 'video' ? 'Video' : 'Picture'} {index + 1}{asset.name ? ` · ${asset.name}` : ''}</Heading>
                        </Col>
                        <Col><ButtonLike onClick={() => removeAsset(index)}>Remove</ButtonLike></Col>
                    </Row>
                    <AttachmentFields name={`${name}.values.assets[${index}].link`} link={asset.link} />
                </Card>
            ))}

            <Modal title="Add from gallery" open={open} onCancel={() => setOpen(false)} footer={null} width={720} destroyOnHidden>
                {open && (
                    <GalleryPanel
                        pageId={pageId}
                        selectable
                        selectLabel="Add"
                        onSelect={(asset) => addAssets([asset])}
                    />
                )}
            </Modal>
        </BlockProps>
    )
}

function ButtonLike({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled} style={{ paddingTop: 4, paddingBottom: 4, paddingLeft: 10, paddingRight: 10, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            {children}
        </button>
    )
}

export const pictureVideoComponent: ComposerComponent<MediaValues> = {
    type: 'picture_video',
    label: 'Picture / Video',
    desc: 'Pictures or videos, a carousel when there is more than one',
    category: 'ui_elements',
    placement: 'body',
    defaults: { height: DEFAULT_MEDIA_HEIGHT, assets: [] },
    fields: [],
    Preview: MediaPreview,
    Props: MediaProps,
    serialize: (values) => ({
        height: mediaHeight(values),
        assets: mediaAssets(values).map((asset) => ({
            _id: asset._id,
            kind: asset.kind === 'video' ? 'video' : 'picture',
            name: asset.name || '',
            url: asset.url,
            type: asset.type || '',
            thumbnails: asset.thumbnails || [],
            link: serializeAttachment(asset.link),
        })),
    }),
}
