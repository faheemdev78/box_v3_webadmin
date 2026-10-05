import css from '../H1.module.scss'
import { defineText } from '../defineText'

export const h1Component = defineText({
    type: 'h1',
    label: 'Heading 1',
    desc: 'Heading one',
    className: css.comp_h1,
    emptyLabel: 'Empty H1',
})
