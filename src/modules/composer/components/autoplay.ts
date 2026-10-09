import { useEffect, useRef } from 'react'

export function autoplaySeconds(value: unknown) {
    const seconds = Number(value)
    if (!Number.isFinite(seconds) || seconds <= 0) return 0
    return Math.min(300, seconds)
}

export function useAutoplay(seconds: number, enabled: boolean, resetKey: unknown, onTick: () => void) {
    const tick = useRef(onTick)
    tick.current = onTick

    useEffect(() => {
        if (!enabled || seconds <= 0) return
        const id = window.setInterval(() => tick.current(), seconds * 1000)
        return () => window.clearInterval(id)
    }, [enabled, seconds, resetKey])
}
