'use client'

import React, { useRef, useState } from 'react'
import { Modal, Space, message } from 'antd'
import { useForm, useFormState } from 'react-final-form'
import get from 'lodash/get'
import { Button, Image } from '@/components'
import { GalleryPanel } from '../gallery/GalleryPanel'
import { uploadGalleryFiles, type GalleryAsset } from '../gallery/uploadGalleryFile'
import { backgroundImageUrl } from './index'

export function BackgroundPicture({ name }: { name?: string }) {
    const form = useForm()
    const values = useFormState({ subscription: { values: true } }).values
    const fieldName = name ? `${name}.styles.background` : 'styles.background'
    const background = get(values, fieldName)
    const src = backgroundImageUrl(background)
    const pageId = values?._id as string | undefined
    const [galleryOpen, setGalleryOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const setPicture = (asset: GalleryAsset | null) => {
        form.batch(() => {
            form.change(`${fieldName}.upload_image`, undefined)
            form.change(`${fieldName}.image`, asset ? {
                url: asset.url,
                url_bucket_path: asset.path,
                type: asset.type || 'image',
                thumbnails: asset.thumbnails || [],
                thumb_bucket_path: asset.thumb_paths?.[0],
            } : null)
        })
    }

    const upload = async (file?: File) => {
        if (!file || !pageId) return
        if (!file.type.startsWith('image/')) {
            message.error('Choose a picture.')
            if (fileRef.current) fileRef.current.value = ''
            return
        }
        setUploading(true)
        try {
            const [asset] = await uploadGalleryFiles([file], pageId)
            if (asset) setPicture(asset)
        } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : 'Upload failed.')
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (<div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 6 }}>Background Picture</div>
        {src && <div style={{ marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#F3F6F4' }}>
            <Image src={src} width={280} height={140} alt="Background picture" style={{ width: '100%', height: 140, objectFit: 'contain' }} />
        </div>}
        <Space size={4} wrap>
            <Button htmlType="button" size="small" onClick={() => fileRef.current?.click()} loading={uploading} disabled={!pageId}>Upload</Button>
            <Button htmlType="button" size="small" onClick={() => setGalleryOpen(true)} disabled={!pageId || uploading}>Gallery</Button>
            {src && <Button htmlType="button" size="small" onClick={() => setPicture(null)} disabled={uploading}>Delete background</Button>}
        </Space>
        {!pageId && <div style={{ marginTop: 6, color: '#666' }}>Save the page before adding background pictures.</div>}
        <input ref={fileRef} type="file" accept="image/*" hidden disabled={uploading || !pageId} onChange={(event) => upload(event.target.files?.[0])} />
        <Modal title="Choose a background picture" open={galleryOpen} onCancel={() => setGalleryOpen(false)} footer={null} width={720} destroyOnHidden>
            {galleryOpen && <GalleryPanel pageId={pageId} kind="picture" selectable selectLabel="Use" onSelect={(asset) => {
                setPicture(asset)
                setGalleryOpen(false)
            }} />}
        </Modal>
    </div>)
}
