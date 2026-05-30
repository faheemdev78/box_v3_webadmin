'use client'

import React, { useEffect, useRef } from 'react'
import onScan from 'onscan.js'

export const BarcodeScanner = ({
  onScan: handleScan,
  onError = undefined,
  enabled = true,
  debugLabel = 'BarcodeScanner',
  focusOnMount = true,
  ignoreIfFocusOn = 'input, textarea, select, [contenteditable="true"]',
  options = undefined,
}) => {
  const focusRef = useRef(null)
  const scanRef = useRef(handleScan)
  const errorRef = useRef(onError)
  const optionsRef = useRef(options || {})

  useEffect(() => {
    scanRef.current = handleScan
  }, [handleScan])

  useEffect(() => {
    errorRef.current = onError
  }, [onError])

  useEffect(() => {
    optionsRef.current = options || {}
  }, [options])

  useEffect(() => {
    if (!enabled) return
    if (typeof document === 'undefined') return

    const focusScannerTarget = () => {
      if (!focusOnMount) return
      if (document.hasFocus()) {
        focusRef.current?.focus({ preventScroll: true })
      }
    }

    focusScannerTarget()

    const handleWindowFocus = () => focusScannerTarget()
    const handleVisibilityChange = () => {
      if (!document.hidden) focusScannerTarget()
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    console.log(`${debugLabel}.attachTo TRUE`)
    onScan.attachTo(document, {
      reactToKeydown: true,
      reactToPaste: true,
      captureEvents: true,
      preventDefault: true,
      stopPropagation: true,
      ignoreIfFocusOn,
      ...optionsRef.current,
      onScan: (barcode, qty) => {
        scanRef.current?.(barcode, qty)
      },
      onScanError: (err) => {
        if (errorRef.current) errorRef.current(err)
        else console.warn(`${debugLabel}.onScanError():`, err)
      },
    })

    return () => {
      onScan.detachFrom(document)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      console.log(`${debugLabel}.attachTo false`)
    }
  }, [debugLabel, enabled, focusOnMount, ignoreIfFocusOn])

  return (
    <div
      ref={focusRef}
      tabIndex={-1}
      aria-hidden="true"
      style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
    />
  )
}
