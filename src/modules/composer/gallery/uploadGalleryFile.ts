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

export async function uploadGalleryFiles(files: File[], pageId: string): Promise<GalleryAsset[]> {
    if (!files.length) throw new Error('Choose picture or video files.')
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URI
    if (!graphqlUrl) throw new Error('Backend GraphQL URL is not configured.')

    const endpoint = new URL(graphqlUrl)
    endpoint.pathname = endpoint.pathname.replace(/\/graphql\/?$/, '') + `/api/pages/${encodeURIComponent(pageId)}/gallery`
    endpoint.search = ''
    endpoint.hash = ''

    const form = new FormData()
    files.forEach((file) => form.append('files', file))

    try {
        const { data } = await axios.post(endpoint.toString(), form, {
            headers: { Authorization: `Bearer ${getSessionToken()}` },
            withCredentials: true,
            timeout: 240000,
        })
        const saved = Array.isArray(data?.files) ? data.files : []
        if (!saved.length || saved.some((item: GalleryAsset) => !item?._id)) {
            throw new Error('The gallery did not save this file.')
        }
        return saved
    } catch (error: any) {
        throw new Error(error?.response?.data?.error?.message || error?.message || 'Upload failed.')
    }
}
