import css from '../productGroup.module.scss'
import { definePlaceholder } from '../../PlaceholderPreview'

export const productGroup = definePlaceholder({
    type: 'prod_group_3_2',
    label: 'Product Group (3 / 2)',
    desc: 'group 2 by 3',
    category: 'products',
    className: css.comp_prod_group,
    emptyLabel: 'Empty ProductGroup',
    defaults: { theme: '#FFFFFF' },
    fields: [
        { key: 'theme', label: 'Theme', type: 'color' },
    ],
})
