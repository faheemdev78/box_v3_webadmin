'use client'

import React from 'react'
import PropTypes from 'prop-types';
import { Alert, DatePicker as AntDatePicker } from 'antd';
import { Field } from 'react-final-form'
import { RenderError, Label } from './extras';
import styles from './Field.module.scss'
// import debounce from 'lodash/debounce';

import { defaultTZ } from '@_/configs';
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import moment from 'moment';
import momentTz from "moment-timezone";

const { RangePicker } = AntDatePicker;

export const DateField = props => {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.tz.setDefault(defaultTZ)
    moment?.tz?.setDefault(defaultTZ);
    momentTz.tz.setDefault(defaultTZ);

    if (props.type == "date"){
        let fieldProps = {
            disabled: props.disabled,
            ...props.fieldProps,
            format: props.format,
            onOk: (value) => {
                if (props.onChange) props.onChange(value);
            },
            // showTime: { format: 'HH:mm' },
            showTime: !!props.showTime,
            format: props.format || "YYYY-MM-DD", // "YYYY-MM-DD HH:mm"
            style: props.style,
        }

        return (<Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                const onChange = (m, dateString) => {
                    input.onChange(m, dateString);
                    if (props.onChange) props.onChange(m, dateString)
                }

                return (
                    <div className={`${styles.field} ${styles.date}`} style={props.wrapperStyle}>
                        <Label isRequired={props.isRequired}>{props.label}</Label>
                        <div className={`${styles.field_wrapper}`}>
                            <AntDatePicker
                                {...fieldProps}
                                {...input}
                                // allowClear={false}
                                // onChange={onChange}
                            />
                            <RenderError {...meta} />
                        </div>
                    </div>
                )
            }}
        </Field>)
    }

    if (props.type == "date-range"){

        let fieldProps = {
            ...props.fieldProps,
            format: props.format,
            onOk: (value) => {
                if (props.onChange) props.onChange(value);
            },
            
            needConfirm: !(props.needConfirm===false),
            showNow: !(props.showNow === false), 
            showTime: (props.showTime === false) ? false : { format: 'HH:mm' },
            // compact
            
            format: props.format || "YYYY-MM-DD HH:mm",
            style: props.style,
            disabled: props.disabled === true ? [true, true] : props.disabled,
        }
        // if (props.onBlur) Object.assign(fieldProps, { onBlur: props.onBlur })
        if (props.onCalendarChange) Object.assign(fieldProps, { onCalendarChange: props.onCalendarChange })
        if (props.onPanelChange) Object.assign(fieldProps, { onPanelChange: props.onPanelChange })
        if (props.disabledDate) Object.assign(fieldProps, { disabledDate: props.disabledDate })

        return (<Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                // ant-picker ant-picker-range css-dev-only-do-not-override-byeoj0
                return (
                    <div className={`${styles.field} ${styles.date}`} style={props.wrapperStyle}>
                        <Label isRequired={props.isRequired}>{props.label}</Label>
                        <div className={`${styles.field_wrapper}`}>
                            <RangePicker
                                {...fieldProps}
                                className={`${props.isRequired && styles.is_required_field}`}
                                style={props.style}
                                {...input}
                                onBlur={props.onBlur || input.onBlur}
                                onPanelChange={props.onPanelChange || input.onPanelChange}
                                // disabled={[true, true]}
                            />
                            <RenderError {...meta} />
                        </div>
                    </div>
                )
            }}
        </Field>)
    }

    // if (props.type == "date-time"){
    //     return (<Field {...props.final_fieldProps}>

    //     </Field>)
    // }

    return (<Alert message={`Invalid field (${props.type})`} type='error' />)

}
DateField.propTypes = {
    name: PropTypes.string.isRequired,
    inputProps: PropTypes.object,
}

export default DateField;
