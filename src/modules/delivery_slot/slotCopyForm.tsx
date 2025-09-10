'use client'
import React, { useState } from 'react'
// import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Alert, Space } from 'antd';
import { Drawer, Button, DevBlock, FileUploader, Icon, IconButton } from '@_/components';
import { catchApolloError, checkApolloRequestErrors, dateToUtc, string_to_slug, timeStr2Date, utcToDate, utcToDateField } from '@_/lib/utill';
import { publishStatus } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import { useMutation } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { FieldArray } from 'react-final-form-arrays';
import { getSettings } from '@_/rStore/slices/systemSlice';
import { useSelector } from "react-redux";

import COPY_SLOTS from '@_/graphql/delivery_slots/copyDelierySlotsTo.graphql';

interface SlotCopyFormProps {
    // onSuccess?: (status: string, data: any) => void;
    onSuccess: () => void;
    day: string;
    deliverySlots: object[];
    store: { _id:string, title:string, code: string, };
}

const SlotCopyFormComp = ({ onSuccess, day, deliverySlots, store }: SlotCopyFormProps) => {
    const [error, setError] = useState(false);
    // const settings = useSelector(getSettings);

    const [copyDelierySlotsTo, copy_details] = useMutation(COPY_SLOTS); // { data, loading, error }

    const onSubmit = async (values) => {
        setError(null);
        // return console.log("onSubmit(): ", values);
        
        let input = { 
            _ids: values.deliverySlots.filter(o => !!o.checked).map(o => o._id), 
            targetDay: values.targetDay,
            store: {
                _id: store._id,
                title: store.title,
                code: store.code
            }
        };


        let resutls = await copyDelierySlotsTo({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.copyDelierySlotsTo }))
            .catch(catchApolloError)
            
        if (resutls.error) {
            setError(resutls.error.message || "Failed to copy slots");
            return;
        }

        onSuccess()
    }


    return (
        <FinalForm onSubmit={onSubmit} initialValues={{ deliverySlots }}
            mutators={{ ...arrayMutators }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}

                    <form id="CopySlotForm" {...submitHandler(formargs)}><Space direction='vertical' style={{ width: "100%" }}>

                        <Divider>Select Slots to copy</Divider>
                        <FormField options={[
                            { label:"Sat", value:"sat" },
                            { label:"Sun", value:"sun" },
                            { label:"Mon", value:"mon" },
                            { label:"Tue", value:"tue" },
                            { label:"Wed", value:"wed" },
                            { label:"Thu", value:"thu" },
                            { label:"Fri", value:"fri" },
                        ]} type="select" name={`targetDay`} validate={rules.required} />

                        <FieldArray name="deliverySlots">                            
                                {({ fields }) => {
                                    return (<>
                                        <Space direction="vertical" style={{ width: "100%" }}>
                                            {fields.map((name, index) => {
                                                const thisNode = fields.value[index];

                                                let start_time = timeStr2Date(thisNode.start_time)
                                                let end_time = timeStr2Date(thisNode.end_time)

                                                return (<Space key={index}>
                                                    <FormField type="checkbox" name={`${name}.checked`}>
                                                        <div>{start_time.format("hh:mm A")} ~ {end_time.format("hh:mm A")}</div>
                                                    </FormField>
                                                </Space>)
                                            })}
                                        </Space>
                                    </>)
                                }}
                        </FieldArray>

                        <div style={{ textAlign:"right" }}><SubmitButton loading={submitting} label={'Save'} /></div>

                        <DevBlock obj={values} title="values" />

                    </Space></form>
                </>)

            }}
        />
    )
}
export const SlotCopyForm: React.FC<SlotCopyFormProps> = (props: SlotCopyFormProps) => {
    let deliverySlots = props?.deliverySlots?.filter(o => (o.day.toLocaleLowerCase() === props.day.toLocaleLowerCase()));

    if (!deliverySlots || deliverySlots.length < 1) return (<Alert type="error" message="No slots found for the selected day" showIcon />)

    // return <DevBlock obj={{ day: props.day, deliverySlots }} />

    return (<SlotCopyFormComp {...props} deliverySlots={deliverySlots.map(o=>({ ...o, checked:true }))} />)
}
