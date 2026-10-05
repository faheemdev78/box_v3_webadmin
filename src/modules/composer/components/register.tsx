'use client'
import React from 'react'
import { addComponent, components } from './connector'
import { ComposerProps } from './ComposerProps'
import type { ComposerComponent, ComposerDragItem, ComposerItem } from './types'

function toLegacy(component: ComposerComponent<any>) {
    const Preview = component.Preview
    const CustomProps = component.Props

    return {
        type: component.type,
        label: component.label,
        desc: component.desc,
        serialize: component.serialize
            ? (values: unknown) => component.serialize?.(values as never)
            : undefined,
        renderer: ({ item }: { item: ComposerItem }) => <Preview item={item} />,
        propsRender: ({ item }: { item: ComposerItem }) => (
            CustomProps ? <CustomProps item={item} /> : <ComposerProps item={item} component={component} />
        ),
    }
}

export function toDragItem(component: ComposerComponent<any>): ComposerDragItem {
    return {
        type: component.type,
        label: component.label,
        desc: component.desc,
        placement: component.placement,
        singleton: !!component.singleton,
        defaults: component.defaults,
    }
}

export function registerComponents(list: ComposerComponent<any>[]) {
    const legacy = list
        .map(toLegacy)
        .filter((item) => !components.some((existing) => existing.type === item.type))

    if (legacy.length) addComponent({ array: legacy })
    return list.map(toDragItem)
}
