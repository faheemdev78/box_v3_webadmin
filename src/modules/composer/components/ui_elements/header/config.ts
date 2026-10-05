import type { ComposerComponent, ComposerField } from '../../types'
import { HeaderPreview } from './Preview'
import { HeaderProps } from './HeaderProps'

export type HeaderLogo = 'white' | 'green'

export type HeaderBarLinkType = 'page' | 'category' | 'product'

export type HeaderBarLink = {
    type?: HeaderBarLinkType | '' | null
    _id?: string
    title?: string
}

export type HeaderBarItem = {
    label?: string
    icon?: string | null
    link?: HeaderBarLink | null
}

export type HeaderValues = {
    theme: string
    logo: HeaderLogo
    top_bar: boolean
    address_bar: boolean
    search_bar: boolean
    cat_bar: boolean
    items?: HeaderBarItem[]
}

export function serializeHeaderBarLink(link?: HeaderBarLink | null) {
    if (!link?._id) return null
    if (link.type !== 'page' && link.type !== 'category' && link.type !== 'product') return null
    return { type: link.type, _id: link._id, title: link.title || '' }
}

export const headerFields: ComposerField[] = [
    { key: 'theme', label: 'Theme', type: 'color' },
    {
        key: 'logo',
        label: 'Logo',
        type: 'select',
        options: [
            { label: 'Logo white', value: 'white' },
            { label: 'Logo green', value: 'green' },
        ],
    },
    { key: 'top_bar', label: 'Top Bar', type: 'switch' },
    { key: 'address_bar', label: 'Address bar', type: 'switch' },
    { key: 'search_bar', label: 'Search bar', type: 'switch' },
    { key: 'cat_bar', label: 'Category bar', type: 'switch' },
]

export const headerComponent: ComposerComponent<HeaderValues> = {
    type: 'header',
    label: 'Header Ui',
    desc: 'App Heading Ui',
    category: 'ui_elements',
    placement: 'chrome',
    singleton: true,
    defaults: {
        theme: '#FFFFFF',
        logo: 'white',
        top_bar: true,
        address_bar: true,
        search_bar: true,
        cat_bar: true,
        items: [],
    },
    fieldsTitle: 'Visual Elements',
    fields: headerFields,
    Preview: HeaderPreview,
    Props: HeaderProps,
    serialize: (values) => {
        const { categories: _removed, ...rest } = (values || {}) as HeaderValues & { categories?: unknown }
        return {
            ...rest,
            items: (values?.items || [])
                .filter((item) => item?.label || item?.icon || item?.link?._id)
                .map((item) => ({
                    label: item.label || '',
                    icon: item.icon || null,
                    link: serializeHeaderBarLink(item.link),
                })),
        }
    },
}
