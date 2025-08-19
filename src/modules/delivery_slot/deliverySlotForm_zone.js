'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Alert } from 'antd';
import { timeStr2Date } from '@_/lib/utill';
import { __error } from '@_/lib/consoleHelper';
import { useMutation } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { DevBlock } from '@_/components';

import RECORD_EDIT from '@_/graphql/delivery_slots/updateZoneDeliverySlot.graphql';

const DeliverySlotFormComp = ({ initialValues, onSuccess, zone }) => {
    const [error, setError] = useState(false);

    const [updateZoneDeliverySlot, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    const onSubmit = async (values) => {
        const _id = initialValues && initialValues._id;

        let input = {
            _id_slot: _id,
            _id_zone: initialValues.zone._id_zone,
            _id_store: initialValues.store._id,
            order_limit: Number(values.zone.order_limit)
        };

        let results = await updateZoneDeliverySlot({ variables: { input } })
            .then((r) => (r?.data?.updateZoneDeliverySlot))
            .catch(error => {
                console.log(__error("Error: "), error);
                return { error: { message: "Request Error!" } }
            });
        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Success");
        onSuccess(results)
        return results;
    }


    return (
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

                    <form id="TimeSlotZoneForm" {...submitHandler(formargs)}><>
                        <Row gutter={[10, 20]}>
                            <Col><FormField type="number" name="zone.order_limit" label="Order Limit" validate={rules.required} /></Col>
                            <Col style={{ paddingTop:"20px" }}><SubmitButton loading={submitting} label={'Save'} /></Col>
                        </Row>
                    </></form>

                    {/* <DevBlock obj={values} /> */}
                    
                </>)

            }}
        />
    )
}
export const DeliverySlotFormZone = (props) => {
    var initialValues = { ...props.initialValues }
    if(props.initialValues){
        Object.assign(initialValues, { 
            start_time: timeStr2Date(props.initialValues.start_time), 
            end_time: timeStr2Date(props.initialValues.end_time)
        })
    }


    return (<DeliverySlotFormComp {...props} initialValues={initialValues} />)
}
DeliverySlotFormZone.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    zone: PropTypes.object.isRequired,
}
