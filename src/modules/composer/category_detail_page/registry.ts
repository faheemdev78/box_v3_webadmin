import { pictureBanner } from './picture_banner/config'

// Category detail components are deliberately excluded from the standard drag-and-drop palette.
export const categoryDetailPageComponents = [pictureBanner]

export function categoryDetailPageComponent(type?: string) {
    return categoryDetailPageComponents.find((component) => component.type === type)
}
