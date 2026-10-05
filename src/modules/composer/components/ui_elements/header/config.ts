import type { ComposerComponent } from '../../types'
import { HeaderPreview } from './Preview'

export type HeaderLogo = 'white' | 'green'

export type HeaderValues = {
    theme: string
    logo: HeaderLogo
    top_bar: boolean
    address_bar: boolean
    search_bar: boolean
    cat_bar: boolean
}

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
    },
    fieldsTitle: 'Visual Elements',
    fields: [
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
    ],
    Preview: HeaderPreview,
}
