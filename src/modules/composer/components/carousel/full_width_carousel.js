'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './Carousel.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


function FullWidthCarousel({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.pic_carousel} style={style}>{values || <span style={{ color: "#999" }}>Empty FullWidthCarousel</span>}</div>
    </>)
}

function FullWidthCarouselProps({ item: { name, data, values } }) {
    return (<>
        <p>No prod props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


export default { 
    type: "full_width_carousel", 
    label: "Full Width", 
    desc: "full width",
    renderer: FullWidthCarousel, 
    propsRender: FullWidthCarouselProps
}