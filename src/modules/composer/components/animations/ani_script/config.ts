import css from '../Animation.module.scss'
import { definePlaceholder } from '../../PlaceholderPreview'

export const aniScript = definePlaceholder({
    type: 'ani_script',
    label: 'Script',
    desc: '.zip',
    category: 'animations',
    className: css.animations,
    emptyLabel: 'Empty AniScript',
})
