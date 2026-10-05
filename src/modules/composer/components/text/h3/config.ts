import css from '../H3.module.scss'
import { defineText } from '../defineText'

export const h3Component = defineText({
    type: 'h3',
    label: 'Heading 3',
    desc: 'Heading three',
    className: css.comp_h3,
    emptyLabel: 'Empty H3',
})
