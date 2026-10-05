'use client'
import { registerComponents, toDragItem } from '../register'
import { pictureVideoComponent } from '../ui_elements/picture_video/config'
import { carousel } from './config'
import { legacyCarouselComponents } from './registry'

const palette = [carousel, pictureVideoComponent]

registerComponents([...palette, ...legacyCarouselComponents])

export const carouselArray = palette.map(toDragItem)
export const carouselTitleItems = [...palette, ...legacyCarouselComponents].map(toDragItem)
