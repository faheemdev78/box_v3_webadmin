import { fas } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const byName = new Map<string, IconDefinition>()

for (const icon of Object.values(fas)) {
    if (!icon?.iconName || byName.has(icon.iconName)) continue
    byName.set(icon.iconName, icon)
}

export const solidIconOptions = [...byName.values()]
    .sort((a, b) => a.iconName.localeCompare(b.iconName))
    .map((icon) => ({ value: icon.iconName, label: icon.iconName }))

export function solidIcon(name?: string | null) {
    if (!name) return undefined
    return byName.get(name)
}
