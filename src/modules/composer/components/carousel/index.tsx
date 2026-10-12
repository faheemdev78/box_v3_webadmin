'use client'
import { registerComponents, toDragItem } from '../register'
import { pictureVideoComponent } from '../ui_elements/picture_video/config'
import { carousel } from './config'
import { coverflowComponent } from './picture_3d/config'
import { legacyCarouselComponents } from './registry'
import { scrollProduct } from './scroll_product/config'

const palette = [carousel, scrollProduct, pictureVideoComponent, coverflowComponent]

registerComponents([...palette, ...legacyCarouselComponents])

export const carouselArray = palette.map(toDragItem)
export const carouselTitleItems = [...palette, ...legacyCarouselComponents].map(toDragItem)
