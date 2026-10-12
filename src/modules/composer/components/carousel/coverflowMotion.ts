export const COVER_SIDE_SCALE = 0.78
export const COVER_CENTER_WIDTH = 54

export function coverCenterWidth(value: unknown) {
    const width = Number(value)
    if (!Number.isFinite(width)) return COVER_CENTER_WIDTH
    return Math.min(90, Math.max(30, Math.round(width)))
}

/** Signed distance from the active slide, wrapped so the row can loop forever. */
export function wrapOffset(index: number, active: number, count: number) {
    if (count <= 1) return 0
    let offset = index - active
    offset -= count * Math.round(offset / count)
    return offset
}

export function coverPose(offset: number, centerWidth: number) {
    const clamped = Math.max(-1.35, Math.min(1.35, offset))
    const distance = Math.abs(clamped)
    const scale = distance >= 1 ? COVER_SIDE_SCALE : 1 - distance * (1 - COVER_SIDE_SCALE)
    const shift = clamped * centerWidth * (1 + COVER_SIDE_SCALE) / 2
    const opacity = distance > 1.2 ? 0 : distance > 1 ? 1 - (distance - 1) / 0.2 : 1
    return {
        shift,
        scale,
        opacity,
        zIndex: distance > 1.2 ? 0 : Math.round((2 - Math.min(distance, 1.2)) * 5),
        visible: distance <= 1.2,
    }
}

export function coverSlideSpan(stageWidth: number, centerWidth: number) {
    return Math.max(48, stageWidth * (centerWidth / 100) * 0.72)
}

/**
 * Finger moving left (negative dx and velocity) advances to the next picture.
 * A short flick still moves one picture. A longer drag can move several, then the row snaps.
 */
export function settleCoverPosition(start: number, dx: number, velocity: number, span: number) {
    if (!Number.isFinite(span) || span <= 0) return start
    if (Math.abs(dx) < 8) return start
    const next = start - dx / span
    if (velocity < -0.35) return Math.max(Math.round(next), Math.floor(start) + 1)
    if (velocity > 0.35) return Math.min(Math.round(next), Math.ceil(start) - 1)
    return Math.round(next)
}

export function stepToSlide(position: number, slideIndex: number, count: number) {
    if (count <= 1) return 0
    return position + wrapOffset(slideIndex, position, count)
}
