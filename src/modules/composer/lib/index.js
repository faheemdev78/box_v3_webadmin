import { cdnImageUrl } from '@/lib/cdnImageUrl'
import { uploadGalleryFiles } from '../gallery/uploadGalleryFile'

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

function borderLine(styleName) {
    if (styleName === 'dashed' || styleName === 'dotted') return styleName
    return 'solid'
}

function borderThickness(border) {
    if (border?.width === undefined || border?.width === null || border?.width === '') return 1
    const n = Number(border.width)
    return Number.isNaN(n) ? 1 : n
}

export function assignBorder(style, border) {
    if (!border) return
    const width = borderThickness(border)
    const color = border.color ? cssColor(border.color, '#000000') : '#000000'
    const line = borderLine(border.style)
    ;['top', 'right', 'bottom', 'left'].forEach((side) => {
        if (!border[side] || width <= 0) return
        const sideName = side.charAt(0).toUpperCase() + side.slice(1)
        style[`border${sideName}Width`] = `${width}px`
        style[`border${sideName}Style`] = line
        style[`border${sideName}Color`] = color
    })
    const radius = spacingPx(border.radius)
    if (radius && Number(border.radius) > 0) {
        style.borderRadius = radius
        style.overflow = 'hidden'
    }
}

export function parseStylesOutput(styles = {}) {
    if (!styles) return {}
    const style = {}

    assignSpacing(style, styles.padding, 'padding')
    assignSpacing(style, styles.margin, 'margin')
    assignBorder(style, styles.border)

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
    if (styles.border) {
        const width = styles.border.width === '' || styles.border.width == null ? undefined : spacingNumber(styles.border.width)
        const radius = styles.border.radius === '' || styles.border.radius == null ? undefined : spacingNumber(styles.border.radius)
        input.border = {
            top: !!styles.border.top,
            right: !!styles.border.right,
            bottom: !!styles.border.bottom,
            left: !!styles.border.left,
            color: styles.border.color ? cssColor(styles.border.color, '') : undefined,
            width,
            style: styles.border.style || undefined,
            radius,
        }
    }

    return input
}

export async function prepareStylesForSave(styles = {}, pageId) {
    const file = styles?.background?.upload_image?.[0]
    if (!(file?.originFileObj instanceof File)) return styles
    if (!pageId) throw new Error('Save the page before uploading a background picture.')

    const [asset] = await uploadGalleryFiles([file.originFileObj], pageId)
    const background = { ...styles.background }
    delete background.upload_image

    return {
        ...styles,
        background: {
            ...background,
            image: {
                url: asset.url,
                url_bucket_path: asset.path,
                type: asset.type || 'image',
                thumbnails: asset.thumbnails || [],
                thumb_bucket_path: asset.thumb_paths?.[0],
            },
        },
    }
}

