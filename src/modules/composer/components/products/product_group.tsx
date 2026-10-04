'use client'
// import React from 'react'
// import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import type { CSSProperties, ReactNode } from 'react';
import cssStyles from './productGroup.module.scss'
import { ComponentStyling, parseStylesOutput } from '../../lib';


interface ProductGroupItem {
    name: string;
    data?: unknown;
    values?: ReactNode;
    styles?: Record<string, unknown>;
}

interface ProductGroupComponentProps {
    item: ProductGroupItem;
}

function ProductGroup({ item: { data, values, styles, name } }: ProductGroupComponentProps) {
    let style: CSSProperties = parseStylesOutput(styles)

    return (<>
        <div className={cssStyles.comp_prod_group} style={style}>{values || <span style={{ color: "#999" }}>Empty ProductGroup</span>}</div>
    </>)
}

function ProductGroupProps({ item: { name, data, values } }: ProductGroupComponentProps) {
    return (<>
        <p>No ProductGroup props configured yet</p>
        <ComponentStyling name={name} />
    </>)
}


const ProductGroupComponent = {
    type: "prod_group_3_2",
    label: "Product Group (3 / 2)",
    desc: "group 2 by 3",
    renderer: ProductGroup,
    propsRender: ProductGroupProps,
    displayName: "ProductGroupComponent"
};

export default ProductGroupComponent;