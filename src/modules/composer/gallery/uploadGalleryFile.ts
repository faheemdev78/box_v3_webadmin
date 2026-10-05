import axios from 'axios'
import { getSessionToken } from '@/lib/auth'
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

export type GalleryUploadHooks = {
    onStart?: (index: number, total: number, file: File) => void
    onSaved?: (asset: GalleryAsset, index: number, total: number) => void
}

function galleryEndpoint(pageId: string) {
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URI
    if (!graphqlUrl) throw new Error('Backend GraphQL URL is not configured.')
    const endpoint = new URL(graphqlUrl)
    endpoint.pathname = endpoint.pathname.replace(/\/graphql\/?$/, '') + `/api/pages/${encodeURIComponent(pageId)}/gallery`
    endpoint.search = ''
    endpoint.hash = ''
    return endpoint.toString()
}

function uploadErrorMessage(error: any) {
    return error?.response?.data?.error?.message || error?.message || 'Upload failed.'
}

async function uploadGalleryFile(file: File, pageId: string): Promise<GalleryAsset> {
    const form = new FormData()
    form.append('files', file)
    try {
        const { data } = await axios.post(galleryEndpoint(pageId), form, {
            headers: { Authorization: `Bearer ${getSessionToken()}` },
            withCredentials: true,
            timeout: 240000,
        })
        const saved = Array.isArray(data?.files) ? data.files[0] : null
        if (!saved?._id) throw new Error('The gallery did not save this file.')
        return saved
    } catch (error: any) {
        throw new Error(uploadErrorMessage(error))
    }
}

export async function uploadGalleryFiles(files: File[], pageId: string, hooks?: GalleryUploadHooks): Promise<GalleryAsset[]> {
    if (!files.length) throw new Error('Choose picture or video files.')
    const saved: GalleryAsset[] = []
    const failed: string[] = []

    for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        hooks?.onStart?.(index, files.length, file)
        try {
            const asset = await uploadGalleryFile(file, pageId)
            saved.push(asset)
            hooks?.onSaved?.(asset, index, files.length)
        } catch (error: any) {
            failed.push(`${file.name}: ${error?.message || 'Upload failed.'}`)
        }
    }

    if (failed.length) {
        const error = new Error(failed.join('\n')) as Error & { saved: GalleryAsset[] }
        error.saved = saved
        throw error
    }
    return saved
}
