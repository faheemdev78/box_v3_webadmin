'use client'
import React, { useState } from 'react'
import { Drawer } from 'antd'
import { Button, Icon } from '@/components'
import { GalleryPanel } from './GalleryPanel'

export function GalleryButton({ pageId }: { pageId?: string }) {
    const [open, setOpen] = useState(false)

    return (<>
        <Button onClick={() => setOpen(true)} tooltip={{ title: 'Gallery', placement: 'bottom' }} icon={<Icon icon="image" />} />
        <Drawer title="Page gallery" open={open} onClose={() => setOpen(false)} size={520}>
            {open && <GalleryPanel pageId={pageId} />}
        </Drawer>
    </>)
}
