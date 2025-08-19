'use client'

import React, { useState, useEffect } from 'react'
import styles from './StatusTag.module.scss'
// import { Button } from '@_/components';
import { Col, Row, Modal, message } from 'antd';
import { __error } from '@_/lib/consoleHelper';
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import _ from 'lodash'

/* eslint-disable react-hooks/exhaustive-deps */
export const StatusTag: React.FC<StatusTagProps> = ({ size=14, value, editable, options, onSubmit, type="tag" }) => {
    const [busy, setbusy] = useState(false);
    const [val, setVal] = useState(value);
    const [showModal, set_showModal] = useState(false);

    useEffect(() => {
        setVal(value);
    }, [value])

    // const [form] = AntForm.useForm();

    const toggleForm = async () => set_showModal(!showModal);
    
    const onFormSubmit = async (values: FormValues): Promise<string | boolean | undefined> => {
        setbusy(true)
        let result = await onSubmit(values);
        // console.log("result: ", result)
        setbusy(false);
        if (!result) return;

        if (!_.isString(result)){
            message.error("Return value should be a string");
            return;
        }

        setVal(result);
        toggleForm();
    }

    const _props: React.HTMLAttributes<HTMLSpanElement> = {
        className: `${styles.status_tag} ${styles['status_' + val]} ${editable && styles.editable}`,
    }
    if (editable) Object.assign(_props, { onClick: toggleForm })

    const spanStyle: React.CSSProperties = {
        fontSize: `${size}px`,
        ...(_props.style || {}),
    };
    // if (val == "in-active" || val=='hidden') Object.assign(style, { backgroundColor: "#FF0000", borderColor:"red" })
    // if (val == "published" || val == 'active') Object.assign(style, { backgroundColor: "#1FBA52", borderColor:"#1CA047" })


    return (<>
        <span {..._props} style={spanStyle}>{val}</span>

        <Modal open={showModal} footer={false} onCancel={toggleForm} title={`Update Status (${val})`}>
            {showModal && <>
                <FinalForm onSubmit={onFormSubmit} initialValues={{ status: val }}
                    render={(formargs) => {
                        const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                        return (<>
                            {/* {error || router?.query?.error && <Alert message={error || router?.query?.error} showIcon type='error' />} */}

                            <form id="statusUpdater" {...submitHandler(formargs)}><Row gutter={[10, 10]}>
                                <Col span={24}><FormField name="status" options={options} placeholder={`${val}`} type="select" validate={rules.required} /></Col>
                                <Col span={24}><FormField name="status_notes" label="Notes" type="textarea" /></Col>
                                <Col span={24} align="center"><SubmitButton loading={submitting} disabled={invalid} color="orange" label="Update" /></Col>
                            </Row></form>
                        </>)

                    }}
                />

            </>}
        </Modal>
    </>)
}



interface Option {
    label: string;
    value: string;
}

interface FormValues {
    status: string;
    status_notes?: string;
}

interface StatusTagProps {
    size?: number;
    value: string;
    editable?: boolean;
    options: Option[];
    onSubmit: (values: FormValues) => Promise<string | undefined>;
    type?: 'tag' | string;
}