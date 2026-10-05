import { h1Component } from './h1/config'
import { h2Component } from './h2/config'
import { h3Component } from './h3/config'
import { textComponent } from './text/config'
import type { ComposerComponent } from '../types'

export const textComponents: ComposerComponent[] = [
    h1Component,
    h2Component,
    h3Component,
    textComponent,
]
