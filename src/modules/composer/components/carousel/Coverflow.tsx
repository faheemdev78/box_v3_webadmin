'use client'
import React, { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { autoplaySeconds, useAutoplay } from '../autoplay'

export type CoverSlide = {
    key?: string
    src: string
    alt?: string
    video?: boolean
}

export type CoverNavigation = 'none' | 'dots' | 'dashes' | 'arrows'

function neighborOffset(index: number, active: number, count: number) {
    let offset = index - active
    if (count > 1) {
        if (offset > count / 2) offset -= count
        if (offset < -count / 2) offset += count
    }
    return offset
}

export function Coverflow({ slides, navigation, autoplay, emptyLabel }: {
    slides: CoverSlide[]
    navigation: CoverNavigation
    autoplay?: number
    emptyLabel: string
}) {
    const count = slides.length
    const [index, setIndex] = useState(0)
    const seconds = autoplaySeconds(autoplay)
    const active = count ? index % count : 0

    useEffect(() => {
        if (count && index >= count) setIndex(0)
    }, [count, index])

    useAutoplay(seconds, count > 1, active, () => {
        setIndex((current) => (current + 1) % count)
    })

    const go = (next: number) => {
        if (!count) return
        setIndex(((next % count) + count) % count)
    }

    if (!count) return <div style={{ color: '#999', paddingTop: 12, paddingBottom: 12 }}>{emptyLabel}</div>

    return (
        <div>
            {count < 3 && <div style={{ color: '#999', fontSize: 12, paddingBottom: 6 }}>Add at least 3 pictures.</div>}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 1', overflow: 'hidden' }}>
                {slides.map((slide, slideIndex) => {
                    const offset = neighborOffset(slideIndex, active, count)
                    const distance = Math.abs(offset)
                    const shift = Math.max(-1.35, Math.min(1.35, offset)) * 48
                    const style: CSSProperties = {
                        position: 'absolute',
                        top: '50%',
                        left: `calc(50% + ${shift}%)`,
                        width: '54%',
                        height: '86%',
                        border: 0,
                        padding: 0,
                        borderRadius: 18,
                        overflow: 'hidden',
                        background: '#f3f4f6',
                        cursor: 'pointer',
                        zIndex: distance > 1 ? 0 : distance === 0 ? 5 : 2,
                        opacity: distance > 1 ? 0 : 1,
                        pointerEvents: distance > 1 ? 'none' : 'auto',
                        transform: `translate(-50%, -50%) scale(${offset === 0 ? 1 : 0.78})`,
                        transition: 'left 480ms cubic-bezier(0.22, 0.8, 0.28, 1), transform 480ms cubic-bezier(0.22, 0.8, 0.28, 1), opacity 480ms ease',
                        boxShadow: offset === 0 ? '0 10px 24px rgba(0,0,0,0.16)' : '0 6px 14px rgba(0,0,0,0.1)',
                    }
                    return (
                        <button key={slide.key || slideIndex} type="button" style={style} onClick={() => go(slideIndex)} aria-label={slide.alt || `Picture ${slideIndex + 1}`}>
                            {slide.src && (slide.video
                                ? <video src={slide.src} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                                : <img src={slide.src} alt={slide.alt || ''} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />)}
                        </button>
                    )
                })}
                {navigation === 'arrows' && <CoverArrows onPrev={() => go(active - 1)} onNext={() => go(active + 1)} />}
                {(navigation === 'dots' || navigation === 'dashes') && <CoverMarks navigation={navigation} page={active} pages={count} />}
            </div>
        </div>
    )
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
        zIndex: 6,
    })
    return (
        <>
            <button type="button" aria-label="Previous" style={button('left')} onClick={onPrev}>‹</button>
            <button type="button" aria-label="Next" style={button('right')} onClick={onNext}>›</button>
        </>
    )
}

function CoverMarks({ navigation, page, pages }: { navigation: 'dots' | 'dashes'; page: number; pages: number }) {
    return (
        <div style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-50%)', display: 'flex', gap: 4, pointerEvents: 'none', zIndex: 6, background: 'rgba(0,0,0,0.28)', borderRadius: 8, padding: '4px 8px' }}>
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
