import { defineCarousel } from '../defineCarousel'

export const scrollProduct = defineCarousel({
    type: 'scroll_product',
    label: 'Scroll product',
    desc: 'Free sideways scroll',
    columns: 2,
    rows: 1,
    behavior: 'scroll',
})
