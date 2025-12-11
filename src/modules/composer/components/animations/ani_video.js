'use client'
// import React from 'react'
// import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import cssStyles from './Animation.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


function AnimationVideo({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.animations} style={style}>{values || <span style={{ color: "#999" }}>Empty AnimationVideo</span>}</div>
    </>)
}

function AnimationVideoProps({ item: { name, data, values } }) {
    return (<>
        <p>No prod props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


const AnimationVideoComponent = {
    type: "ani_video",
    label: "Video",
    desc: ".mp4",
    renderer: AnimationVideo,
    propsRender: AnimationVideoProps,
    displayName: "AnimationVideoComponent"
};

export default AnimationVideoComponent;