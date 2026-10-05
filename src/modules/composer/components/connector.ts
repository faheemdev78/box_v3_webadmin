import type { ComponentType } from 'react'
import type { ComposerItem } from './types'

export type RegisteredComponent = {
    type: string
    label: string
    desc: string
    renderer: ComponentType<{ item: ComposerItem }>
    propsRender: ComponentType<{ item: ComposerItem }>
    serialize?: (values: unknown) => unknown
}

export const components: RegisteredComponent[] = []

export function addComponent({ array = [], comp }: { array?: RegisteredComponent[]; comp?: RegisteredComponent }) {
    if (comp) components.push(comp)
    array.forEach((item) => components.push(item))
}
