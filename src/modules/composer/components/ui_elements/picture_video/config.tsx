'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, Modal, Space, message } from 'antd'
import { useForm, useFormState } from 'react-final-form'
import get from 'lodash/get'
import { DeleteButton, IconButton, Image } from '@/components'
import thumbStyles from '@/components/FileUploader.module.scss'
import { Heading } from '../../../typography'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import type { ComposerComponent, ComposerItem } from '../../types'
import { BlockProps } from '../BlockProps'
import { blockFrame } from '../blockFrame'
import { AttachmentFields } from '../AttachmentFields'
import { serializeAttachment } from '../attachment'
import { GalleryPanel } from '../../../gallery/GalleryPanel'
import { uploadGalleryFiles, type GalleryAsset } from '../../../gallery/uploadGalleryFile'

export type MediaValues = {
    kind?: 'picture' | 'video'
    asset?: GalleryAsset | null
    assets?: GalleryAsset[]
}

const liquidMedia = { width: '100%', height: 'auto', display: 'block' } as const

export function mediaAssets(values?: MediaValues | null): GalleryAsset[] {
    if (Array.isArray(values?.assets) && values.assets.length) {
        return values.assets.filter((asset) => asset?._id || asset?.url)
    }
    if (values?.asset?._id || values?.asset?.url) return [values.asset]
    return []
}

function MediaSlide({ asset }: { asset: GalleryAsset }) {
    const src = asset.url ? cdnImageUrl(asset.url) : ''
    if (asset.kind === 'video' && asset.url) {
        return <video src={cdnImageUrl(asset.url)} controls style={{ ...liquidMedia, background: '#000' }} />
    }
    if (src) {
        return <img src={src} alt={asset.name || 'picture'} style={liquidMedia} />
    }
    return null
}

function MediaPreview({ item }: { item: ComposerItem<MediaValues> }) {
    const assets = mediaAssets(item?.values)
    const carousel = assets.length > 1

    return (
        <div style={blockFrame(item)}>
            {!assets.length && <div style={{ color: '#999', paddingTop: 12, paddingBottom: 12 }}>No media</div>}
            {assets.length === 1 && <MediaSlide asset={assets[0]} />}
            {carousel && (
                <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', width: '100%' }}>
                    {assets.map((asset, index) => (
                        <div key={asset._id || index} style={{ flex: '0 0 100%', minWidth: '100%' }}>
                            <MediaSlide asset={asset} />
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
    const formValues = useFormState({ subscription: { values: true } }).values
    const assets = mediaAssets((get(formValues, `${name}.values`) || item?.values) as MediaValues)
    const fileRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [preview, setPreview] = useState<GalleryAsset | null>(null)
    const [linkIndex, setLinkIndex] = useState<number | null>(null)

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

    const saveLink = () => {
        if (linkIndex == null) return
        const link = get(form.getState().values, `${name}.values.assets[${linkIndex}].link`)
        if (link?.type && !link?._id) {
            message.error('Choose the category, product, or brand to attach.')
            return
        }
        form.change(`${name}.values.assets[${linkIndex}].link`, serializeAttachment(link))
        setLinkIndex(null)
    }

    const clearLink = () => {
        if (linkIndex == null) return
        form.change(`${name}.values.assets[${linkIndex}].link`, null)
        setLinkIndex(null)
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
            const saved = await uploadGalleryFiles(accepted, pageId)
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {assets.map((asset, index) => (
                        <AssetTile
                            key={asset._id || index}
                            asset={asset}
                            linked={!!serializeAttachment(asset.link)}
                            onPreview={() => setPreview(asset)}
                            onLink={() => setLinkIndex(index)}
                            onRemove={() => removeAsset(index)}
                        />
                    ))}
                </div>
            </Card>

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

            <Modal
                title={preview?.name || (preview?.kind === 'video' ? 'Video' : 'Picture')}
                open={!!preview}
                onCancel={() => setPreview(null)}
                footer={null}
                width={720}
                destroyOnHidden
            >
                {preview?.kind === 'video' && preview.url
                    ? <video src={cdnImageUrl(preview.url)} controls style={{ width: '100%', maxHeight: 480, background: '#000' }} />
                    : preview?.url && <Image src={cdnImageUrl(preview.url)} width={680} height={480} alt={preview.name || 'picture'} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />}
            </Modal>

            <Modal
                title={linkIndex == null ? 'Attach' : (assets[linkIndex]?.name || 'Attach')}
                open={linkIndex != null}
                onCancel={() => setLinkIndex(null)}
                destroyOnHidden
                footer={(
                    <Space>
                        <Button onClick={clearLink}>Clear</Button>
                        <Button type="primary" onClick={saveLink}>Save</Button>
                    </Space>
                )}
            >
                {linkIndex != null && (
                    <AttachmentFields name={`${name}.values.assets[${linkIndex}].link`} link={assets[linkIndex]?.link} />
                )}
            </Modal>
        </BlockProps>
    )
}

function AssetTile({ asset, linked, onPreview, onLink, onRemove }: {
    asset: GalleryAsset
    linked: boolean
    onPreview: () => void
    onLink: () => void
    onRemove: () => void
}) {
    const src = asset.kind === 'picture' ? cdnImageUrl(asset.thumbnails?.[0] || asset.url) : ''

    return (
        <div className={thumbStyles.gal_thumb_holder} style={{ width: 120, height: 120 }} title={asset.name || ''}>
            {src
                ? <Image src={src} width={120} height={120} alt={asset.name || 'picture'} className={thumbStyles.thumb_img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ color: '#1677ff', fontSize: 28 }}>{asset.kind === 'video' ? '▶' : ''}</div>}
            <div className={thumbStyles.hover_layer} style={{ alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-evenly', background: 'rgba(0,0,0,0.72)', paddingTop: 4, paddingBottom: 4 }}>
                    <IconButton size="small" icon="eye" onClick={onPreview} />
                    <IconButton size="small" icon={linked ? 'link' : 'link-slash'} onClick={onLink} />
                    <DeleteButton size="small" onClick={onRemove} />
                </div>
            </div>
        </div>
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
    defaults: { assets: [] },
    fields: [],
    Preview: MediaPreview,
    Props: MediaProps,
    serialize: (values) => ({
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
