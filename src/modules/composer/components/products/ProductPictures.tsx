'use client'
import React, { useRef, useState } from 'react'
import { Modal, Select, Space, message } from 'antd'
import { useForm, useFormState } from 'react-final-form'
import get from 'lodash/get'
import { Button, Image } from '@/components'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import { GalleryPanel } from '../../gallery/GalleryPanel'
import { uploadGalleryFiles, type GalleryAsset } from '../../gallery/uploadGalleryFile'
import { composerImageFit, composerImageObjectFit, composerProductImage, type ComposerProduct } from './types'

export function ProductPictures({ name }: { name: string }) {
    const form = useForm<Record<string, unknown>>()
    const values = useFormState({ subscription: { values: true } }).values
    const path = `${name}.values.products`
    const products = (get(values, path) || []) as ComposerProduct[]
    const pageId = values?._id as string | undefined
    const [galleryProduct, setGalleryProduct] = useState<string | null>(null)
    const [busyProduct, setBusyProduct] = useState<string | null>(null)
    const uploadProduct = useRef<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const setPicture = (id: string, asset: GalleryAsset | null) => {
        const current = (get(form.getState().values, path) || []) as ComposerProduct[]
        form.change(path, current.map(product => product?._id === id ? {
            ...product,
            custom_picture: asset ? { _id: asset._id, url: asset.url, name: asset.name || '', thumbnails: asset.thumbnails || [] } : null,
        } : product))
    }
    const upload = async (file?: File) => {
        const id = uploadProduct.current
        if (!id || !file || !pageId) return
        if (!file.type.startsWith('image/')) {
            message.error('Choose a picture.')
            if (fileRef.current) fileRef.current.value = ''
            return
        }
        setBusyProduct(id)
        try {
            const assets = await uploadGalleryFiles([file], pageId)
            if (assets[0]) setPicture(id, assets[0])
        } catch (error: any) {
            message.error(error?.message || 'Upload failed.')
        } finally {
            setBusyProduct(null)
            uploadProduct.current = null
            if (fileRef.current) fileRef.current.value = ''
        }
    }
    return <>
        <div style={{ color: '#666', marginTop: 8 }}>Optional custom images apply to this list only. Remove one to use the product’s main picture.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
            {products.map((product, index) => {
                const src = composerProductImage(product)
                return <div key={product?._id || `empty-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 8 }}>
                    <div style={{ height: 80, overflow: 'hidden', textAlign: 'center' }}>
                        {src ? <Image src={cdnImageUrl(src)} width={120} height={80} alt={product?.title || ''} style={{ width: '100%', height: '100%', objectFit: composerImageObjectFit(product.image_fit) }} /> : <span>{product?._id ? 'No picture' : 'Empty'}</span>}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12 }}>{product?.title || ' '}</div>
                    {product?._id && <div style={{ marginTop: 8 }}>
                        <label htmlFor={`${name}-product-fit-${index}`} style={{ display: 'block', fontSize: 12 }}>Image fit</label>
                        <Select id={`${name}-product-fit-${index}`} aria-label={`Image fit for ${product.title || 'product'}`} style={{ width: '100%' }}
                            value={composerImageFit(product.image_fit)}
                            onChange={fit => form.change(`${path}[${index}].image_fit`, fit)}
                            options={[
                                { label: 'Contain — show full image', value: 'contain' },
                                { label: 'Cover — fill and crop', value: 'cover' },
                                { label: 'Stretch — fill frame', value: 'stretch' },
                                { label: 'Center — no upscaling', value: 'center' },
                            ]} />
                    </div>}
                    {product?._id && <Space wrap size={4} style={{ marginTop: 4 }}>
                        <Button htmlType="button" size="small" disabled={!pageId || !!busyProduct} loading={busyProduct === product._id} onClick={() => { uploadProduct.current = product._id!; fileRef.current?.click() }}>Upload</Button>
                        <Button htmlType="button" size="small" disabled={!!busyProduct} onClick={() => setGalleryProduct(product._id!)}>Gallery</Button>
                        {product.custom_picture && <Button htmlType="button" size="small" disabled={!!busyProduct} onClick={() => setPicture(product._id!, null)}>Reset image</Button>}
                    </Space>}
                </div>
            })}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={event => upload(event.target.files?.[0])} />
        <Modal title="Choose a product picture" open={galleryProduct != null} onCancel={() => setGalleryProduct(null)} footer={null} width={720} destroyOnHidden>
            {galleryProduct && <GalleryPanel pageId={pageId} kind="picture" selectable selectLabel="Use" onSelect={asset => { setPicture(galleryProduct, asset); setGalleryProduct(null) }} />}
        </Modal>
    </>
}
