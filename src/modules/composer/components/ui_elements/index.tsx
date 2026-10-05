'use client'
import { registerComponents } from '../register'
import { uiElements } from './registry'

export const ui_elementsArray = registerComponents(uiElements)

export { uiElements, uiElementsByType } from './registry'
