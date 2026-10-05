import css from '../Animation.module.scss'
import { definePlaceholder } from '../../PlaceholderPreview'

export const aniVideo = definePlaceholder({
    type: 'ani_video',
    label: 'Video',
    desc: '.mp4',
    category: 'animations',
    className: css.animations,
    emptyLabel: 'Empty AnimationVideo',
})
