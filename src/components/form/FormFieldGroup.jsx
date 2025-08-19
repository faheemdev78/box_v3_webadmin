'use client'

import React from 'react'
import { Input } from 'antd';
// import FormField from './FormField';


export const FormFieldGroup = props => {
    return (<>
        <Input.Group compact={props.compact} style={props.style} className="form-field field-margins field-group">
            {props.label && <label>{props.label}</label>}
            {props.children}
            {/* {
                props.children.map((item, i) => {
                    return item;
                })
            } */}
        </Input.Group>
    </>)
}

export default FormFieldGroup;