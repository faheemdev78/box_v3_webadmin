'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
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
import moment from 'moment';
import dayjs from 'dayjs';

import RECORD_EDIT from '@_/graphql/delivery_slots/editDeliverySlot.graphql';
import RECORD_ADD from '@_/graphql/delivery_slots/addDeliverySlot.graphql';


function validateTime(values) {
    let isValid = !!(values?.start_time?.isValid() && values?.end_time?.isValid());

    if (isValid) {
        let start = dayjs(values.start_time);
        let end = dayjs(values.end_time);
        return end.isAfter(start)
    }
    return isValid;
}


const DeliverySlotFormComp = ({ initialValues, onClose, onSuccess, open, store }) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const settings = useSelector(getSettings);

    const [editDeliverySlot, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addDeliverySlot, add_details] = useMutation(RECORD_ADD); // { data, loading, error }

    const onSubmit = async (values) => {
        setError(null);
        
        const _id = initialValues && initialValues._id;

        if (!validateTime(values)){
            setError("Start Time should be before End Time")
            return;
        }

        let input = {
            day: values.day,
            status: values.status,
            start_time: Number(values.start_time.format("HHmm")), //Number(values.start_time),
            end_time: Number(values.end_time.format("HHmm")), // Number(values.end_time),
            blocked_dates: values?.blocked_dates?.map(o => (dateToUtc(o, { tz: settings.timezone }))),
            store: {
                _id: store._id,
                title: store.title,
                code: store.code,
                // center: values.store.center,
            }
        };

        if (_id) {
            Object.assign(input, { _id })
            return _editDeliverySlot(input)
        }
        else return _addDeliverySlot(input)
    }

    const _editDeliverySlot = async (input) => {
        setLoading(true)
        let results = await editDeliverySlot({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.editDeliverySlot }))
            .catch(catchApolloError)

        setLoading(false)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (onSuccess) onSuccess('updated', results)
        onClose(results);
    }

    const _addDeliverySlot = async (input) => {
        let results = await addDeliverySlot({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.addDeliverySlot }))
            .catch(catchApolloError)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        if (onSuccess) onSuccess('added', results)
        onClose(results);
    }


    return (
        <Drawer width={400} destroyOnHidden maskClosable={true} placement="right"
            onClose={onClose}
            open={open}
            footer={false}
            title={`${initialValues && initialValues._id ? 'Edit' : 'Add'} Slot`}
        >
            <FinalForm onSubmit={onSubmit} initialValues={initialValues}
                mutators={{
                    ...arrayMutators,
                    // onManufacturerChange: (newValueArray, state, tools) => {
                    //     let val = newValueArray[1];
                    //     console.log("onManufacturerChange: ", val)
                    //     tools.changeValue(state, 'manufacturer', () => val)
                    // },

                }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}

                        <form id="TimeSlotForm" {...submitHandler(formargs)}><Space direction='vertical' style={{ width: "100%" }}>
                            <Row gutter={[10, 20]}>
                                <Col span={12}><FormField type="select" name="day" label="Day" validate={rules.required}
                                    options={[
                                        { label:"Sat", value:"sat" }, { label:"Sun", value:"sun" }, { label:"Mon", value:"mon" },
                                        { label:"Tue", value:"tue" }, { label:"Wed", value:"wed" }, { label:"Thu", value:"thu" },
                                        { label:"Fri", value:"fri" },
                                    ]}
                                /></Col>
                                <Col span={12}><FormField type="select" name="status" label="Status" options={publishStatus} validate={rules.required} /></Col>
                                
                                {/* <Col span={8}><FormField type="number" name="start_time" min={0} max={2359} label="Start Time" validate={rules.required} /></Col> */}
                                <Col span={8}><FormField type="time" name="start_time" label="Start Time" 
                                    validate={[rules.required]}
                                    /></Col>
                                <Col span={8}><FormField type="time" name="end_time" label="End Time" 
                                    validate={[rules.required]}
                                    // validate={[rules.required, rules.bol(validateTime(), 'End time should be after the start time')]}
                                /></Col>
                                <Col span={8} style={{ color:"red", paddingTop: "23px" }}>{!validateTime(values) && "Invalid time"}</Col>
                                {/* <Col span={8}><FormField type="number" name="end_time" min={0} max={2359} label="End Time" validate={rules.required} /></Col> */}
                            </Row>
                            {/* <FormField type="number" name="slot_time" label="Time" validate={rules.required} /> */}

                            <Divider>Blocked Days</Divider>
                            <FieldArray name="blocked_dates">
                                {({ fields }) => {
                                    return (<>
                                        <Space size={10} wrap>
                                            {fields.map((name, index) => {
                                                const thisNode = fields.value[index];

                                                return (<Space key={index}>
                                                    <FormField type="date" name={name} validate={rules.required} style={{ width:"130px" }} />
                                                    <div style={{ paddingTop:"0px" }}><IconButton onClick={() => fields.remove(index)} type="danger" icon="trash-alt" /></div>
                                                </Space>)

                                            })}
                                            
                                        </Space>
                                        <div align="center" style={{ padding:"10px" }}><Button type="dashed" onClick={() => fields.push(null)} icon={<Icon icon="plus" />}>Add Date To Block</Button></div>
                                    </>)
                                }}
                            </FieldArray>
                            
                        </Space>

                            <Row>
                                <Col flex="auto" />
                                <Col><SubmitButton loading={submitting} label={'Save'} /></Col>
                            </Row>

                            <DevBlock obj={values} title="values" />

                        </form>
                    </>)

                }}
            />

        </Drawer>
    )
}
export const DeliverySlotForm = (props) => {
    var initialValues = { ...props.initialValues }
    if(props.initialValues){
        // let start_time = timeStr2Date(props.initialValues.start_time)
        // let end_time = timeStr2Date(props.initialValues.end_time)
        Object.assign(initialValues, { 
            start_time: timeStr2Date(props.initialValues.start_time), 
            end_time: timeStr2Date(props.initialValues.end_time)
        })
    }


    return (<DeliverySlotFormComp {...props} initialValues={initialValues} />)
}
DeliverySlotForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    onSuccess: PropTypes.func,
    initialValues: PropTypes.object,
    store: PropTypes.object.isRequired,
}
