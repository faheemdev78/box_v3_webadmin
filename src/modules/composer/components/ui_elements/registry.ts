import { headerComponent } from './header/config'
import { spacerComponent } from './spacer/config'
import { dividerComponent } from './divider/config'
import { horizontalLineComponent } from './horizontal_line/config'
import { pictureVideoComponent } from './picture_video/config'
import type { ComposerComponent } from '../types'

export const uiElements: ComposerComponent<any>[] = [
    headerComponent,
    spacerComponent,
    dividerComponent,
    horizontalLineComponent,
    pictureVideoComponent,
]

export const uiElementsByType: Record<string, ComposerComponent<any>> = Object.fromEntries(
    uiElements.map((component) => [component.type, component])
)
