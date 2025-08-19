'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './Carousel.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


function PicCarousel({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.pic_carousel} style={style}>{values || <span style={{ color: "#999" }}>Empty PicCarousel</span>}</div>
    </>)
}

function PicCarouselProps({ item: { name, data, values } }) {
    return (<>
        <p>No prod props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


export default { 
    type: "pic_carousel_1", 
    label: "Carousel", 
    desc: "carousel",
    renderer: PicCarousel, 
    propsRender: PicCarouselProps
}