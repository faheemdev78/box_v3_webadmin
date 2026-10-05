import axios from 'axios'
import { cdnImageUrl } from '@/lib/cdnImageUrl'

export * from './componentStyling'
export * from './componentSchedule'

function spacingPx(value) {
    if (value === undefined || value === null || value === '') return undefined
    const n = Number(value)
    return Number.isNaN(n) ? undefined : `${n}px`
}

function spacingNumber(value) {
    if (value === undefined || value === null || value === '') return 0
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
}

export function cssColor(value, fallback = '#ffffff') {
    if (value == null || value === '') return fallback
    if (typeof value === 'string') return value
    if (typeof value.toHexString === 'function') return value.toHexString() || fallback
    if (typeof value.toRgbString === 'function') return value.toRgbString() || fallback
    return fallback
}

function cssUrl(value) {
    if (!value) return ''
    return `url("${String(value).replace(/"/g, '%22')}")`
}

export function backgroundImageUrl(background) {
    const file = background?.upload_image?.[0]
    const editing = file?.src?.image || file?.src?.url || file?.thumbUrl
    if (editing) return editing

    const saved = background?.image
    if (!saved) return ''
    return cdnImageUrl(saved.url || saved.thumbnails?.[0] || '')
}

function assignSpacing(style, box, prefix) {
    if (!box) return
    const top = spacingPx(box.top)
    const right = spacingPx(box.right)
    const bottom = spacingPx(box.bottom)
    const left = spacingPx(box.left)
    if (top !== undefined) style[`${prefix}Top`] = top
    if (right !== undefined) style[`${prefix}Right`] = right
    if (bottom !== undefined) style[`${prefix}Bottom`] = bottom
    if (left !== undefined) style[`${prefix}Left`] = left
}

export function parseStylesOutput(styles = {}) {
    if (!styles) return {}
    const style = {}

    assignSpacing(style, styles.padding, 'padding')
    assignSpacing(style, styles.margin, 'margin')

    const background = styles.background
    if (background) {
        const color1 = cssColor(background.color1, '#ffffff')
        const color2 = cssColor(background.color2, color1)

        if (background.type === 'solid' && background.color1) {
            style.backgroundColor = color1
        }

        if (background.type === 'gradient') {
            const angle = background.direction === 'horizontal' ? '90deg' : '180deg'
            style.backgroundColor = color1
            style.backgroundImage = `linear-gradient(${angle}, ${color1} 0%, ${color2} 100%)`
        }

        const image = backgroundImageUrl(background)
        if (image) {
            style.backgroundImage = cssUrl(image)
            style.backgroundRepeat = 'no-repeat'
            style.backgroundPosition = 'center'
            style.backgroundSize = 'cover'
        }
    }

    return style
}

function imageInput(image) {
    if (!image?.url || String(image.url).startsWith('data:')) return undefined
    return {
        url: image.url,
        url_bucket_path: image.url_bucket_path || undefined,
        type: image.type || 'image',
        thumbnails: Array.isArray(image.thumbnails) ? image.thumbnails : undefined,
        thumb_bucket_path: image.thumb_bucket_path || undefined,
    }
}

export function parseStylesInput(styles = {}) {
    if (!styles) return {}

    const input = {}
    if (styles.background) {
        input.background = {
            type: styles.background.type || undefined,
            direction: styles.background.direction || undefined,
            color1: styles.background.color1 ? cssColor(styles.background.color1, '') : undefined,
            color2: styles.background.color2 ? cssColor(styles.background.color2, '') : undefined,
            image: imageInput(styles.background.image),
        }
    }
    if (styles.margin) {
        input.margin = {
            top: spacingNumber(styles.margin.top),
            right: spacingNumber(styles.margin.right),
            bottom: spacingNumber(styles.margin.bottom),
            left: spacingNumber(styles.margin.left),
        }
    }
    if (styles.padding) {
        input.padding = {
            top: spacingNumber(styles.padding.top),
            right: spacingNumber(styles.padding.right),
            bottom: spacingNumber(styles.padding.bottom),
            left: spacingNumber(styles.padding.left),
        }
    }

    return input
}

export async function prepareStylesForSave(styles = {}) {
    const file = styles?.background?.upload_image?.[0]
    if (!(file?.originFileObj instanceof File)) return styles

    const endpoint = process.env.NEXT_PUBLIC_CDN_API_URI
    if (!endpoint) throw new Error('Background picture upload is not configured.')

    const formData = new FormData()
    formData.append('folder', 'composer/backgrounds')
    formData.append('thumbnails', JSON.stringify([{ width: 960, height: 960 }]))
    formData.append('files', file.originFileObj)

    let uploaded
    try {
        const response = await axios.post(`${endpoint}/upload_files`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploaded = response?.data?.files?.[0]
    } catch (error) {
        const message = error?.response?.data?.error || error?.message || 'Background picture upload failed.'
        throw new Error(message)
    }

    if (!uploaded?.url) throw new Error('Background picture upload failed.')

    return {
        ...styles,
        background: {
            ...styles.background,
            image: {
                url: cdnImageUrl(uploaded.url),
                type: uploaded.type || 'image',
                thumbnails: (uploaded.thumbnails || []).map((item) => cdnImageUrl(item)).filter(Boolean),
            },
        },
    }
}

