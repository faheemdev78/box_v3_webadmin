export type AttachmentType = 'category' | 'product' | 'brand' | 'page'

export type ComposerAttachment = {
    type?: AttachmentType | '' | null
    _id?: string
    title?: string
}

export function serializeAttachment(link?: ComposerAttachment | null) {
    if (!link?._id || (link.type !== 'category' && link.type !== 'product' && link.type !== 'brand' && link.type !== 'page')) return null
    return {
        type: link.type,
        _id: link._id,
        title: link.title || '',
    }
}
