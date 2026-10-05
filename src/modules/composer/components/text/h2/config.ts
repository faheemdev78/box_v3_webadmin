import css from '../H2.module.scss'
import { defineText } from '../defineText'

export const h2Component = defineText({
    type: 'h2',
    label: 'Heading 2',
    desc: 'Heading two',
    className: css.comp_h2,
    emptyLabel: 'Empty H2',
})
