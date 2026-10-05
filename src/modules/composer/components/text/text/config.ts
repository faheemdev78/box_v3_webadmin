import css from '../Text.module.scss'
import { defineText } from '../defineText'

export const textComponent = defineText({
    type: 'text',
    label: 'Text',
    desc: 'Simple text',
    className: css.comp_text,
    emptyLabel: 'Empty Text',
})
