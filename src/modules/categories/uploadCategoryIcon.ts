import axios from 'axios'
import { getSessionToken } from '@/lib/auth'

export async function uploadCategoryIcon(file: File, catId: string) {
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URI
    if (!graphqlUrl) throw new Error('Backend GraphQL URL is not configured.')
    const endpoint = new URL(graphqlUrl)
    endpoint.pathname = endpoint.pathname.replace(/\/graphql\/?$/, '') + `/api/product-cats/${encodeURIComponent(catId)}/icon`
    endpoint.search = ''
    endpoint.hash = ''
    const form = new FormData()
    form.append('files', file)
    try {
        const { data } = await axios.post(endpoint.toString(), form, {
            headers: { Authorization: `Bearer ${getSessionToken()}` },
            withCredentials: true,
            timeout: 60000,
        })
        if (!data?.icon_img) throw new Error('The SVG did not save.')
        return data as { icon_img: string }
    } catch (error: any) {
        throw new Error(error?.response?.data?.error?.message || error?.message || 'SVG upload failed.')
    }
}
