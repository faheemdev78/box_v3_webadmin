'use client'
// import React from 'react'
// import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import cssStyles from './Categories.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


function Cat_r1_c3_2({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.categories} style={style}>{values || <span style={{ color: "#999" }}>Empty Cat_r1_c3_2</span>}</div>
    </>)
}

function Cat_r1_c3_2Props({ item: { name, data, values } }) {
    return (<>
        <p>No prod props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


const Cat_r1_c3_2Component = {
    type: "cat_r1_c3_2",
    label: "R1 / C3",
    desc: "R1 / C3 (2)",
    renderer: Cat_r1_c3_2,
    propsRender: Cat_r1_c3_2Props,
    displayName: "Cat_r1_c3_2Component"
};

export default Cat_r1_c3_2Component;