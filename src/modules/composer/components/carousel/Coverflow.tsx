'use client'
import React, { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { autoplaySeconds, useAutoplay } from '../autoplay'
import { coverCenterWidth, coverPose, coverSlideSpan, settleCoverPosition, stepToSlide, wrapOffset } from './coverflowMotion'

export type CoverSlide = {
    key?: string
    src: string
    alt?: string
    video?: boolean
}

export type CoverNavigation = 'none' | 'dots' | 'dashes' | 'arrows'

export function Coverflow({ slides, navigation, autoplay, centerWidth, animated = true, emptyLabel }: {
    slides: CoverSlide[]
    navigation: CoverNavigation
    autoplay?: number
    centerWidth?: number
    animated?: boolean
    emptyLabel: string
}) {
    const count = slides.length
    const width = coverCenterWidth(centerWidth)
    const imageRatio = useFirstMediaRatio(slides[0])
    const stageRef = useRef<HTMLDivElement>(null)
    const positionRef = useRef(0)
    const dragRef = useRef<{ pointerId: number; x: number; lastX: number; lastTime: number; velocity: number; moved: boolean; start: number } | null>(null)
    const suppressClick = useRef(false)
    const [position, setPosition] = useState(0)
    const [dragging, setDragging] = useState(false)
    const seconds = autoplaySeconds(autoplay)
    const page = count ? ((Math.round(position) % count) + count) % count : 0

    const moveTo = (next: number) => {
        positionRef.current = next
        setPosition(next)
    }

    useAutoplay(seconds, animated && count > 1 && !dragging, page, () => {
        moveTo(positionRef.current + 1)
    })

    const span = () => coverSlideSpan(stageRef.current?.clientWidth || 0, width)

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!animated || count < 2) return
        if (event.pointerType === 'mouse' && event.button !== 0) return
        if ((event.target as HTMLElement).closest('[data-coverflow-control]')) return
        dragRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            lastX: event.clientX,
            lastTime: performance.now(),
            velocity: 0,
            moved: false,
            start: positionRef.current,
        }
        setDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return
        const now = performance.now()
        const step = event.clientX - drag.lastX
        const dt = Math.max(16, now - drag.lastTime)
        drag.velocity = step / dt
        drag.lastX = event.clientX
        drag.lastTime = now
        const dx = event.clientX - drag.x
        if (Math.abs(dx) > 6) drag.moved = true
        moveTo(drag.start - dx / span())
    }

    const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return
        dragRef.current = null
        setDragging(false)
        const dx = event.clientX - drag.x
        if (drag.moved) suppressClick.current = true
        const settled = settleCoverPosition(drag.start, dx, drag.velocity, span())
        requestAnimationFrame(() => moveTo(settled))
    }

    const onClickCapture = (event: React.MouseEvent) => {
        if (!suppressClick.current) return
        suppressClick.current = false
        event.preventDefault()
        event.stopPropagation()
    }

    if (!count) return <div style={{ color: '#999', paddingTop: 12, paddingBottom: 12 }}>{emptyLabel}</div>

    return (
        <div>
            {count < 3 && <div style={{ color: '#999', fontSize: 12, paddingBottom: 6 }}>Add at least 3 pictures.</div>}
            <div
                ref={stageRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onClickCapture={onClickCapture}
                style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: imageRatio ? `100 / ${width * imageRatio}` : undefined,
                    minHeight: imageRatio ? undefined : 80,
                    overflow: 'hidden',
                    touchAction: 'pan-y',
                    userSelect: 'none',
                    cursor: animated && count > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
                }}
            >
                {slides.map((slide, slideIndex) => {
                    const pose = coverPose(wrapOffset(slideIndex, position, count), width)
                    const style: CSSProperties = {
                        position: 'absolute',
                        top: '50%',
                        left: `calc(50% + ${pose.shift}%)`,
                        width: `${width}%`,
                        height: '100%',
                        border: 0,
                        padding: 0,
                        borderRadius: 18,
                        overflow: 'hidden',
                        background: '#f3f4f6',
                        cursor: 'inherit',
                        zIndex: pose.zIndex,
                        opacity: pose.opacity,
                        pointerEvents: animated && pose.visible ? 'auto' : 'none',
                        transform: `translate(-50%, -50%) scale(${pose.scale})`,
                        transition: animated && !dragging ? 'left 420ms cubic-bezier(0.22, 0.8, 0.28, 1), transform 420ms cubic-bezier(0.22, 0.8, 0.28, 1), opacity 420ms ease' : 'none',
                        boxShadow: Math.abs(wrapOffset(slideIndex, position, count)) < 0.5 ? '0 10px 24px rgba(0,0,0,0.16)' : '0 6px 14px rgba(0,0,0,0.1)',
                    }
                    return (
                        <button key={slide.key || slideIndex} type="button" style={style} onClick={() => { if (animated) moveTo(stepToSlide(positionRef.current, slideIndex, count)) }} aria-label={slide.alt || `Picture ${slideIndex + 1}`}>
                            {slide.src && (slide.video
                                ? <video src={slide.src} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
                                : <img src={slide.src} alt={slide.alt || ''} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />)}
                        </button>
                    )
                })}
                {animated && navigation === 'arrows' && count > 1 && (
                    <CoverArrows onPrev={() => moveTo(positionRef.current - 1)} onNext={() => moveTo(positionRef.current + 1)} />
                )}
                {(navigation === 'dots' || navigation === 'dashes') && count > 1 && <CoverMarks navigation={navigation} page={page} pages={count} />}
            </div>
        </div>
    )
}

function useFirstMediaRatio(slide?: CoverSlide) {
    const [ratio, setRatio] = useState(0)
    const src = slide?.src || ''
    const video = !!slide?.video

    useEffect(() => {
        if (!src) {
            setRatio(0)
            return
        }
        let alive = true
        const apply = (mediaWidth: number, mediaHeight: number) => {
            if (alive && mediaWidth > 0 && mediaHeight > 0) setRatio(mediaHeight / mediaWidth)
        }
        if (video) {
            const node = document.createElement('video')
            node.preload = 'metadata'
            node.onloadedmetadata = () => apply(node.videoWidth, node.videoHeight)
            node.src = src
            return () => { alive = false }
        }
        const node = new Image()
        node.onload = () => apply(node.naturalWidth, node.naturalHeight)
        node.src = src
        return () => { alive = false }
    }, [src, video])

    return ratio
}

function CoverArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
    const button = (side: 'left' | 'right'): CSSProperties => ({
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [side]: 6,
        width: 32,
        height: 32,
        border: 0,
        borderRadius: 16,
        background: 'rgba(0,0,0,0.35)',
        color: '#fff',
        cursor: 'pointer',
        zIndex: 8,
    })
    return (
        <>
            <button type="button" data-coverflow-control="" aria-label="Previous" style={button('left')} onPointerDown={(event) => event.stopPropagation()} onClick={onPrev}>‹</button>
            <button type="button" data-coverflow-control="" aria-label="Next" style={button('right')} onPointerDown={(event) => event.stopPropagation()} onClick={onNext}>›</button>
        </>
    )
}

function CoverMarks({ navigation, page, pages }: { navigation: 'dots' | 'dashes'; page: number; pages: number }) {
    return (
        <div style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-50%)', display: 'flex', gap: 4, pointerEvents: 'none', zIndex: 8, background: 'rgba(0,0,0,0.28)', borderRadius: 8, padding: '4px 8px' }}>
            {Array.from({ length: pages }, (_, mark) => (
                <span
                    key={mark}
                    style={{
                        width: navigation === 'dashes' ? 10 : 6,
                        height: navigation === 'dashes' ? 5 : 6,
                        borderRadius: navigation === 'dashes' ? 1 : 6,
                        background: mark === page ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                    }}
                />
            ))}
        </div>
    )
}
