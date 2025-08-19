'use client'

import React from 'react'
import PropTypes from 'prop-types';
import { DatePicker as AntDatePicker } from 'antd';
import { Field } from 'react-final-form'
import styles from './Field.module.scss'
// import debounce from 'lodash/debounce';
import _ from 'lodash';
import { RenderError, Label } from './extras';


const { RangePicker } = AntDatePicker;


export const DateRangeField = props => {
    let fieldProps = {
        ...props.fieldProps,
        format: props.format,
        onOk: (value) => {
            if (props.onChange) props.onChange(value);
        },
        showTime: { format: 'HH:mm' },
        format: props.format || "YYYY-MM-DD HH:mm",
        style: props.style,
    }

    return (
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                return (
                    <div className={`${styles.field} ${styles.date}`} style={props.wrapperStyle}>
                        <Label isRequired={props.isRequired}>{props.label}</Label>
                        <div className={`${styles.field_wrapper}`}>
                            <RangePicker
                                {...fieldProps}
                                {...input}
                                // value={[moment('2022/01/01', 'YYYY/MM/DD'), moment('2022/01/01', 'YYYY/MM/DD')]}
                            />
                            <RenderError {...meta} />
                        </div>
                    </div>
                )
            }}
        </Field>
    )

}
DateRangeField.propTypes = {
    name: PropTypes.string.isRequired,
    inputProps: PropTypes.object,
}

export default DateRangeField;

