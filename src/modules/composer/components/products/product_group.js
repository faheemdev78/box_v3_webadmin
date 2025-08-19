'use client'
import React from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import cssStyles from './productGroup.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


function ProductGroup({ item: { data, values, styles, name } }) {
    let style = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.comp_prod_group} style={style}>{values || <span style={{ color: "#999" }}>Empty ProductGroup</span>}</div>
    </>)
}

function ProductGroupProps({ item: { name, data, values } }) {
    return (<>
        <p>No ProductGroup props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


export default { 
    type: "prod_group_3_2",
    label: "Product Group (3 / 2)",
    desc: "group 2 by 3",
    renderer: ProductGroup, 
    propsRender: ProductGroupProps
}