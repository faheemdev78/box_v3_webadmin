'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, Modal, Space, message } from 'antd'
import { useForm, useFormState } from 'react-final-form'
import get from 'lodash/get'
import { DeleteButton, IconButton, Image } from '@/components'
import thumbStyles from '@/components/FileUploader.module.scss'
import { FormField } from '@/components/form'
import { Heading } from '../../../typography'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import type { ComposerComponent, ComposerItem } from '../../types'
import { BlockProps } from '../BlockProps'
import { blockFrame } from '../blockFrame'
import { AttachmentFields } from '../AttachmentFields'
import { serializeAttachment } from '../attachment'
import { GalleryPanel } from '../../../gallery/GalleryPanel'
import { uploadGalleryFiles, type GalleryAsset } from '../../../gallery/uploadGalleryFile'

export type MediaNavigation = 'none' | 'dots' | 'dashes' | 'arrows'

export type MediaValues = {
    kind?: 'picture' | 'video'
    navigation?: MediaNavigation
    asset?: GalleryAsset | null
    assets?: GalleryAsset[]
}

const NAVIGATION_OPTIONS = [
    { label: "Don't show", value: 'none' },
    { label: 'Show dots', value: 'dots' },
    { label: 'Show dash lines', value: 'dashes' },
    { label: 'Show arrows', value: 'arrows' },
]

function mediaNavigation(value?: string | null): MediaNavigation {
    return value === 'dots' || value === 'dashes' || value === 'arrows' ? value : 'none'
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
    const navigation = mediaNavigation(item?.values?.navigation)
    const scroller = useRef<HTMLDivElement>(null)
    const [page, setPage] = useState(0)

    const scrollToPage = (next: number) => {
        const node = scroller.current
        if (!node?.clientWidth) return
        node.scrollTo({ left: Math.min(assets.length - 1, Math.max(0, next)) * node.clientWidth, behavior: 'smooth' })
    }

    return (
        <div style={blockFrame(item)}>
            {!assets.length && <div style={{ color: '#999', paddingTop: 12, paddingBottom: 12 }}>No media</div>}
            {assets.length === 1 && <MediaSlide asset={assets[0]} />}
            {carousel && (
                <div style={{ position: 'relative', width: '100%' }}>
                    <div
                        ref={scroller}
                        onScroll={() => {
                            const node = scroller.current
                            if (!node?.clientWidth) return
                            setPage(Math.min(assets.length - 1, Math.max(0, Math.round(node.scrollLeft / node.clientWidth))))
                        }}
                        style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', width: '100%' }}
                    >
                        {assets.map((asset, index) => (
                            <div key={asset._id || index} style={{ flex: '0 0 100%', minWidth: '100%' }}>
                                <MediaSlide asset={asset} />
                            </div>
                        ))}
                    </div>
                    {navigation !== 'none' && <MediaNav navigation={navigation} page={page} pages={assets.length} onArrow={scrollToPage} />}
                </div>
            )}
        </div>
    )
}

function MediaNav({ navigation, page, pages, onArrow }: {
    navigation: MediaNavigation
    page: number
    pages: number
    onArrow: (page: number) => void
}) {
    if (navigation === 'arrows') {
        const button = (side: 'left' | 'right'): React.CSSProperties => ({
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            [side]: 6,
            width: 32,
            height: 32,
            border: 0,
            borderRadius: 16,
            background: 'rgba(0,0,0,0.35)',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 2,
        })
        return (
            <>
                <button type="button" aria-label="Previous" style={button('left')} onClick={() => onArrow(page - 1)}>‹</button>
                <button type="button" aria-label="Next" style={button('right')} onClick={() => onArrow(page + 1)}>›</button>
            </>
        )
    }

    const mark = (active: boolean): React.CSSProperties => ({
        width: navigation === 'dashes' ? 10 : 6,
        height: navigation === 'dashes' ? 5 : 6,
        borderRadius: navigation === 'dashes' ? 1 : 6,
        background: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
    })

    return (
        <div style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-50%)', display: 'flex', gap: 4, pointerEvents: 'none', zIndex: 2, background: 'rgba(0,0,0,0.28)', borderRadius: 8, padding: '4px 8px' }}>
            {Array.from({ length: pages }, (_, index) => <span key={index} style={mark(index === page)} />)}
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
    const [queueLabel, setQueueLabel] = useState('')
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
        setQueueLabel(`Uploading 1 of ${accepted.length}`)
        try {
            const saved = await uploadGalleryFiles(accepted, pageId, {
                onStart: (index, total) => setQueueLabel(`Uploading ${index + 1} of ${total}`),
                onSaved: (asset) => addAssets([asset]),
            })
            message.success(saved.length > 1 ? `Added ${saved.length} files to the page gallery` : 'Added to the page gallery')
        } catch (error: any) {
            const savedCount = Array.isArray(error?.saved) ? error.saved.length : 0
            if (savedCount) message.success(`Added ${savedCount} file${savedCount > 1 ? 's' : ''} to the page gallery`)
            message.error(error?.message || 'Upload failed.')
        } finally {
            setBusy(false)
            setQueueLabel('')
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (
        <BlockProps item={item}>
            <Card styles={{ body: { padding: '10px' } }}>
                <Heading style={undefined}>Media</Heading>
                <FormField name={`${name}.values.navigation`} type="select" label="Show navigation" options={NAVIGATION_OPTIONS} />
                <div style={{ marginTop: 8, marginBottom: 8, color: '#666' }}>
                    {assets.length > 1 ? `${assets.length} items, shown as a carousel` : `${assets.length} item`}
                </div>
                <Space>
                    <ButtonLike onClick={() => setOpen(true)}>Choose from gallery</ButtonLike>
                    <ButtonLike onClick={() => fileRef.current?.click()} disabled={busy || !pageId}>
                        {busy ? (queueLabel || 'Uploading…') : 'Upload new'}
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
        <div className={thumbStyles.gal_thumb_holder} style={{ width: 110, height: 110 }} title={asset.name || ''}>
            {src
                ? <Image src={src} width={110} height={110} alt={asset.name || 'picture'} className={thumbStyles.thumb_img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
    desc: 'static or auto carousel',
    category: 'carousel',
    placement: 'body',
    defaults: { navigation: 'none', assets: [] },
    fields: [],
    Preview: MediaPreview,
    Props: MediaProps,
    serialize: (values) => ({
        navigation: mediaNavigation(values?.navigation),
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
