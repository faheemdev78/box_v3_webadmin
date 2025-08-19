import picCarousel from './pic_carousel'
import fullWidthCarousel from './full_width_carousel'
import carouselR1C3_1 from './carousel_r1_c3_1'
import carouselR1C3_2 from './carousel_r1_c3_2'

import { addComponent } from '../connector'


export const carouselArray = [
    picCarousel, fullWidthCarousel, carouselR1C3_1, carouselR1C3_2
    // { type: "pic_carousel_1", label: "Carousel", desc: "carousel", ...picCarousel },
    // { type: "full_width_carousel", label: "Full Width", desc: "full width", ...fullWidthCarousel },
    // { type: "carousel_r1_c3_1", label: "R1 / C3", desc: "R1 / C3", ...carouselR1C3_1 },
    // { type: "carousel_r1_c3_2", label: "R1 / C3", desc: "R1 / C3", ...carouselR1C3_2 },
]

addComponent({ array: carouselArray })

