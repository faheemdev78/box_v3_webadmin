import { useEffect, useRef } from 'react'

const RETAIN = 0.9

export function useGlideScroll() {
    const ref = useRef<HTMLDivElement>(null)
    const scrollByRef = useRef<(delta: number) => void>(() => {})

    useEffect(() => {
        const node = ref.current
        if (!node) return

        let velocity = 0
        let frame = 0
        let dragging = false
        let moved = false
        let suppressClick = false
        let travel = 0
        let lastX = 0
        let lastTime = 0
        let pointerId: number | null = null

        const maxScroll = () => Math.max(0, node.scrollWidth - node.clientWidth)

        const step = () => {
            if (Math.abs(velocity) < 0.3) {
                velocity = 0
                node.style.cursor = 'grab'
                return
            }
            const max = maxScroll()
            const next = Math.min(max, Math.max(0, node.scrollLeft + velocity))
            node.scrollLeft = next
            if (next <= 0 || next >= max) velocity = 0
            else velocity *= RETAIN
            frame = requestAnimationFrame(step)
        }

        const kick = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(step)
        }

        scrollByRef.current = (delta: number) => {
            velocity = delta * (1 - RETAIN)
            kick()
        }

        const onWheel = (event: WheelEvent) => {
            const max = maxScroll()
            if (max <= 1) return
            const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            const delta = horizontal ? event.deltaX : event.deltaY
            if (!delta) return
            const atStart = node.scrollLeft <= 0 && delta < 0
            const atEnd = node.scrollLeft >= max - 1 && delta > 0
            if (!horizontal && (atStart || atEnd) && Math.abs(velocity) < 0.5) return
            event.preventDefault()
            velocity += delta * 0.14
            kick()
        }

        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return
            dragging = true
            moved = false
            travel = 0
            pointerId = event.pointerId
            lastX = event.clientX
            lastTime = performance.now()
            velocity = 0
            cancelAnimationFrame(frame)
            node.setPointerCapture(event.pointerId)
            node.style.cursor = 'grabbing'
        }

        const onPointerMove = (event: PointerEvent) => {
            if (!dragging || event.pointerId !== pointerId) return
            const now = performance.now()
            const dx = event.clientX - lastX
            travel += Math.abs(dx)
            if (travel > 5) moved = true
            const dt = Math.max(16, now - lastTime)
            node.scrollLeft -= dx
            velocity = (-dx / dt) * 16
            lastX = event.clientX
            lastTime = now
        }

        const endDrag = (event: PointerEvent) => {
            if (!dragging || event.pointerId !== pointerId) return
            dragging = false
            pointerId = null
            if (moved) suppressClick = true
            kick()
        }

        const onClick = (event: MouseEvent) => {
            if (!suppressClick) return
            event.preventDefault()
            event.stopPropagation()
            suppressClick = false
        }

        const onDragStart = (event: DragEvent) => event.preventDefault()

        node.style.cursor = 'grab'
        node.addEventListener('wheel', onWheel, { passive: false })
        node.addEventListener('pointerdown', onPointerDown)
        node.addEventListener('pointermove', onPointerMove)
        node.addEventListener('pointerup', endDrag)
        node.addEventListener('pointercancel', endDrag)
        node.addEventListener('click', onClick, true)
        node.addEventListener('dragstart', onDragStart)

        return () => {
            cancelAnimationFrame(frame)
            node.removeEventListener('wheel', onWheel)
            node.removeEventListener('pointerdown', onPointerDown)
            node.removeEventListener('pointermove', onPointerMove)
            node.removeEventListener('pointerup', endDrag)
            node.removeEventListener('pointercancel', endDrag)
            node.removeEventListener('click', onClick, true)
            node.removeEventListener('dragstart', onDragStart)
        }
    }, [])

    return {
        ref,
        scrollBy: (delta: number) => scrollByRef.current(delta),
    }
}
