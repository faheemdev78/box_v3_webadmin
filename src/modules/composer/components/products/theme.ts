const NAMED_INK: Record<string, string> = {
    white: '#FFFFFF',
    green: '#60a52c',
    black: '#000000',
}

export function productInk(theme?: string | null) {
    const value = String(theme || '').trim()
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value
    return NAMED_INK[value.toLowerCase()] || '#FFFFFF'
}
