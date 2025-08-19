'use client'

import React from 'react'
import PropTypes from 'prop-types';
import { Field } from 'react-final-form'
import { Label, RenderError } from './extras';
import { ColorPicker } from 'antd';
import styles from './Field.module.scss'


export const ColorField = (props) => {
    return (<>
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {

                const fieldProps = {
                    onChange: (color, __) => {
                        let _color = typeof color === 'string' ? color : color?.toHexString();
                        return (input.onChange(_color))
                    },
                    value: input.value,
                    defaultFormat: "hex",
                    format: "hex",
                    disabledAlpha: true,
                    allowClear: true,
                    showText: false,
                    // onChangeComplete={(color, __) => console.log(color)}
                    // onChange={console.log}
                }

                return (<div className={`${styles.field} ${styles.color_picker}`}>
                    <Label isRequired={props.isRequired}>{props.label}</Label>

                    <div className={`${styles.field_wrapper}`}>
                        <ColorPicker mode="single" {...fieldProps} />
                    </div>
                    <RenderError {...meta} />
                </div>)
            }}
        </Field>
    </>)
}
ColorField.propTypes = {
    name: PropTypes.string.isRequired,
}
