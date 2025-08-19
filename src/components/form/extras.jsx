'use client'

import React from 'react'
import { Button } from '../button'
import styles from './Field.module.scss';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Tooltip, message } from 'antd';
import { moveToErrorPosition } from './lib';

export const Label = ({ children, isRequired, htmlFor, style }) => !children ? null : <label htmlFor={htmlFor} className={`${styles.label}`} style={{ ...style, display:"inline-block" }}>{isRequired && "* "}{children}</label>;

export const RenderError = meta => {
    // return (meta.error && meta.touched) ? <div className="field-error">{meta.error}</div> : null;
    return !(meta.error && meta.touched) ? null : 
        <div className={`${styles.error}`}>
            <Tooltip placement="left" title={meta.error} color="red">
                <ExclamationCircleFilled className={`${styles.error_icon}`} />
            </Tooltip>
        </div>
}

export const SubmitButton = (props) => <Button type="primary" htmlType="submit" {...props} color={props.color || "orange"}>{props.label || 'Submit'}</Button>

export const ExternalSubmitButton = ({ label, form_id, color, loading }) => <Button loading={loading} color={color} onClick={() => {
    document.getElementById(form_id).dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
}}>{label || "Submit"}</Button>


export const submitHandler = (formProps, props) => {
    const {
        handleSubmit, invalid, form, errors, dirty, hasSubmitErrors, submitError, submitErrors, submitFailed, submitSucceeded,
        modifiedSinceLastSubmit, hasValidationErrors
    } = formProps;
    /**
     props: {onSubmitSuccess}
     */
    // onSubmit = { event => {
    //     if (invalid) {
    //         message.error("Oops! seems like you missed something.");
    //         moveToErrorPosition(errors)
    //     }
    //     // form.reset({})
    //     handleSubmit(event)
    // }}

    // console.log("props.onSubmitSuccess: ", (props && props.onSubmitSuccess))

    return {
        onSubmit: async (event) => {
            // console.log("formProps: ", formProps)
            await handleSubmit(event)?.then(r => {
                // console.log("modifiedSinceLastSubmit: ", modifiedSinceLastSubmit)
                // if (!modifiedSinceLastSubmit && props.submitOnChnage===false){
                //     console.log("No chnages found")
                //     return false;
                // }

                // console.log("R: ", r)

                // console.log("form: ", form.mutators.setFieldData)
                if (props && props.onSubmitSuccess && !r?.error?.message && r!==false) props.onSubmitSuccess(r)
                if (r == "reset") form.reset({})
                // if (r !== false && props.onSubmitSuccess && !r?.error?.message) props.onSubmitSuccess(r)
                return r;
            })

            // if (dirty && invalid && errors && errors.length > 0 && hasValidationErrors && hasSubmitErrors && submitError && submitErrors && submitFailed){
            //     message.error("Oops! seems like you missed something.");
            //     moveToErrorPosition(errors)
            // }

            if (invalid && hasValidationErrors) {
                message.error("Oops! seems like you missed something.");
                moveToErrorPosition(errors)
            }

        },
        className: "final_form_component",
        size: 'small',
    }
}

