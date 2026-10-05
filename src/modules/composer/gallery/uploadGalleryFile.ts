import axios from 'axios'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import type { ComposerAttachment } from '../components/ui_elements/attachment'

export type GalleryAsset = {
    _id?: string
    _id_parent?: string
    kind: 'picture' | 'video'
    name?: string
    url: string
    path?: string
    type?: string
    thumbnails?: string[]
    thumb_paths?: string[]
    link?: ComposerAttachment | null
}

export async function uploadGalleryFile(file: File, pageId: string): Promise<Omit<GalleryAsset, '_id' | '_id_parent'>> {
    const endpoint = process.env.NEXT_PUBLIC_CDN_API_URI
    if (!endpoint) throw new Error('Media upload is not configured.')

    const isPicture = file.type.startsWith('image/')
    const formData = new FormData()
    formData.append('folder', `composer/gallery/${pageId}`)
    if (isPicture) formData.append('thumbnails', JSON.stringify([{ width: 960, height: 960 }]))
    formData.append('files', file)

    let uploaded
    try {
        const response = await axios.post(`${endpoint}/upload_files`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploaded = response?.data?.files?.[0]
    } catch (error: any) {
        throw new Error(error?.response?.data?.error || error?.message || 'Upload failed.')
    }

    if (!uploaded?.url) throw new Error('Upload failed.')

    return {
        kind: isPicture ? 'picture' : 'video',
        name: file.name,
        url: cdnImageUrl(uploaded.url),
        path: uploaded.url,
        type: uploaded.type || (isPicture ? 'image' : 'video'),
        thumbnails: (uploaded.thumbnails || []).map((item: string) => cdnImageUrl(item)).filter(Boolean),
        thumb_paths: uploaded.thumbnails || [],
    }
}
