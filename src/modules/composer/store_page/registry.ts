import { pictureBanner } from './picture_banner/config'

// Store components are deliberately excluded from the standard drag-and-drop palette.
export const storePageComponents = [pictureBanner]

export function storePageComponent(type?: string) {
    return storePageComponents.find((component) => component.type === type)
}
