import { headerComponent } from './header/config'
import { tabBarComponent } from './tab_bar/config'
import { spacerComponent } from './spacer/config'
import { dividerComponent } from './divider/config'
import { horizontalLineComponent } from './horizontal_line/config'
import type { ComposerComponent } from '../types'

export const uiElements: ComposerComponent<any>[] = [
    headerComponent,
    tabBarComponent,
    spacerComponent,
    dividerComponent,
    horizontalLineComponent,
]

export const uiElementsByType: Record<string, ComposerComponent<any>> = Object.fromEntries(
    uiElements.map((component) => [component.type, component])
)
