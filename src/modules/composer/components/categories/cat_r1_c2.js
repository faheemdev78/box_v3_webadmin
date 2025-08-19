'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './Categories.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


function Cat_r1_c2({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.categories} style={style}>{values || <span style={{ color: "#999" }}>Empty Cat_r1_c2</span>}</div>
    </>)
}

function Cat_r1_c2Props({ item: { name, data, values } }) {
    return (<>
        <p>No prod props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


export default { 
    type: "cat_r1_c2", 
    label: "R1 / C2", 
    desc: "R1 / C2",
    renderer: Cat_r1_c2, 
    propsRender: Cat_r1_c2Props
}