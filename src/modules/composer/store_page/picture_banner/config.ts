import { pictureVideoComponent } from '../../components/ui_elements/picture_video/config'

// Reuse the media editor while keeping the storefront component identity separate.
export const pictureBanner = {
    ...pictureVideoComponent,
    type: 'picture_banner',
    label: 'Picture Banner',
    desc: 'Pictures or videos, static or as a carousel',
}
