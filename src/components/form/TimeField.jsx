'use client'

import React from 'react'
import PropTypes from 'prop-types';
import { TimePicker as AntTimePicker } from 'antd';
import { Field } from 'react-final-form'
import { Label, RenderError } from './extras';
import styles from './Field.module.scss'
// import debounce from 'lodash/debounce';
import { defaultTZ } from '@_/configs';
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import moment from 'moment';
import momentTz from "moment-timezone";


/*************************
    <TimePicker showTime={{ format: 'HH:mm' }} format="HH:mm" onChange={console.log} />
    <TimePicker.RangePicker
        showTime={{ format: 'HH:mm' }}
        format="HH:mm"
        onChange={(e) => console.log("onchnage", e)}
        onOk={(e) => console.log("on OK", e)}
    />
 */

export const TimeField = props => {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.tz.setDefault(defaultTZ)
    moment?.tz?.setDefault(defaultTZ);
    momentTz.tz.setDefault(defaultTZ);

    let fieldProps = {
        disabled: props.disabled,
        ...props.fieldProps,
        format: props.format,
        needConfirm: props.needConfirm || false,
        // onOk: (value) => {
        //     if (props.onChange) props.onChange(value);
        // },
        showTime: { format: props.format || 'hh:mm A' },
        format: props.format || "hh:mm A", // "YYYY-MM-DD HH:mm"
        style: props.style,
    }

    return (<Field {...props.final_fieldProps}>
        {({ input, meta }) => {
            const onChange = (m, dateString) => {
                input.onChange(m, dateString);
                if (props.onChange) props.onChange(m, dateString)
            }

            return (
                <div className={`${styles.field} ${styles.time}`} style={props.wrapperStyle}>
                    <Label isRequired={props.isRequired}>{props.label}</Label>
                    <div className={`${styles.field_wrapper}`}>
                        <AntTimePicker
                            {...fieldProps}
                            {...input}
                            // allowClear={false}
                            onChange={onChange}
                        />
                        <RenderError {...meta} />
                    </div>
                </div>
            )
        }}
    </Field>)



    // let props = { ..._props };
    // delete props.label;
    // delete props.format;
    // delete props.onChange;

    // let fieldProps = {
    //     showTime: { format: _props.format || 'HH:mm'},
    //     format: _props.format || "HH:mm",
    //     disabled: _props.disabled,
    //     // onChange:{ console.log }
    // }
    // if (props.onOk) fieldProps = Object.assign(fieldProps, { onOk: props.onOk });

    // return (
    //     <Field {...props}>
    //         {({ input, meta }) => {

    //             return (<div className={`${styles.field} ${styles.time}`} style={props.wrapperStyle}>

    //             </div>)

    //             return (
    //                 <div className={`form-field ${!props.compact && "field-margins"} date`}>
    //                     {_props.label && <label>{_props.label}</label>}
    //                     <div><AntTimePicker 
    //                         {...fieldProps} 
    //                         {...input} 
    //                         onChange={(m, dateString) => {
    //                             input.onChange(m, dateString)
    //                             if (props.onChange) props.onChange(m, dateString)
    //                         }}
    //                     /></div>
    //                     <RenderError {...meta} />
    //                 </div>
    //             )
    //         }}
    //     </Field>
    // )

}
TimeField.propTypes = {
    name: PropTypes.string.isRequired,
    inputProps: PropTypes.object,
}
export default TimeField;









export const TimeRangeField = _props => {
    let props = { ..._props };
    delete props.label;

    let fieldProps = {
        showTime: { format: props.format || 'HH:mm' },
        format: props.format || "HH:mm",
        // onChange:{ console.log }
    }
    if (props.onOk) fieldProps = Object.assign(fieldProps, { onOk: props.onOk });

    return (
        <Field {...props}>
            {({ input, meta }) => {
                return (
                    <div className={`form-field ${!props.compact && "field-margins"} date`}>
                        {_props.label && <label>{_props.label}</label>}
                        <div><AntTimePicker.RangePicker {...fieldProps} {...input} /></div>
                        {meta.error && meta.touched && <div className="field-error">{meta.error}</div>}
                    </div>
                )
            }}
        </Field>
    )

}
TimeRangeField.propTypes = {
    name: PropTypes.string.isRequired,
    inputProps: PropTypes.object,
}









export const TimePicker = props => {
    let _props = { ...props }
    
    let style = { width: "100%", ...props.style }
    if (props.width) style = Object.assign(style, { width: props.width })
    
    delete _props.label
    delete _props.style
    
    return (<div className="simple-field">
        {props.label && <Label>{props.label}</Label>}
        <TimePicker style={{...style}} {..._props} />
    </div>)
}