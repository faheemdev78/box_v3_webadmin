'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './Carousel.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


function Carousel_r1_c3_1({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.pic_carousel} style={style}>{values || <span style={{ color: "#999" }}>Empty Carousel_r1_c3_1</span>}</div>
    </>)
}

function Carousel_r1_c3_1Props({ item: { name, data, values } }) {
    return (<>
        <p>No prod props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


export default { 
    type: "carousel_r1_c3_1", 
    label: "R1 / C3", 
    desc: "R1 / C3",
    renderer: Carousel_r1_c3_1, 
    propsRender: Carousel_r1_c3_1Props
}