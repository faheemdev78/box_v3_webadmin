'use client'
import { blockFrame } from '../../ui_elements/blockFrame'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import type { ComposerComponent, ComposerItem } from '../../types'
import { Coverflow } from '../Coverflow'
import { coverCenterWidth } from '../coverflowMotion'
import {
    mediaAssets,
    mediaNavigation,
    MediaProps,
    serializeMedia,
    type MediaValues,
} from '../../ui_elements/picture_video/config'

function CoverflowPreview({ item }: { item: ComposerItem<MediaValues> }) {
    const assets = mediaAssets(item?.values)
    return (
        <div style={blockFrame(item)}>
            <Coverflow
                slides={assets.map((asset, index) => ({
                    key: asset._id || String(index),
                    src: asset.url ? cdnImageUrl(asset.url) : '',
                    alt: asset.name || '',
                    video: asset.kind === 'video',
                }))}
                navigation={mediaNavigation(item?.values?.navigation)}
                autoplay={item?.values?.autoplay}
                centerWidth={item?.values?.centerWidth}
                animated={false}
                emptyLabel="Add at least 3 pictures"
            />
        </div>
    )
}

export const coverflowComponent: ComposerComponent<MediaValues> = {
    type: 'picture_3d_carousel',
    label: 'Coverflow',
    desc: 'Center picture larger',
    category: 'carousel',
    placement: 'body',
    defaults: { navigation: 'none', autoplay: 0, centerWidth: 54, assets: [] },
    fields: [],
    Preview: CoverflowPreview,
    Props: MediaProps,
    serialize: (values) => ({
        ...serializeMedia(values),
        centerWidth: coverCenterWidth(values?.centerWidth),
    }),
}
