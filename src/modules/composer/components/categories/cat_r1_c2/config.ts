import css from '../Categories.module.scss'
import { definePlaceholder } from '../../PlaceholderPreview'

export const catR1C2 = definePlaceholder({
    type: 'cat_r1_c2',
    label: 'R1 / C2',
    desc: 'R1 / C2',
    category: 'categories',
    className: css.categories,
    emptyLabel: 'Empty Cat_r1_c2',
})
