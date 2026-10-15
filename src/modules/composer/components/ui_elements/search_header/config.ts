import type { ComposerComponent } from '../../types'
import { SearchHeaderPreview } from './Preview'
import { SearchHeaderProps } from './SearchHeaderProps'

export type SearchHeaderValues = { theme: string }

export const searchHeaderComponent: ComposerComponent<SearchHeaderValues> = {
    type: 'search_header',
    label: 'Search Header',
    desc: 'Back, delivery address, search and share',
    category: 'ui_elements',
    placement: 'chrome',
    singleton: true,
    defaults: { theme: '#333333' },
    fields: [{ key: 'theme', label: 'Theme', type: 'color' }],
    Preview: SearchHeaderPreview,
    Props: SearchHeaderProps,
}
