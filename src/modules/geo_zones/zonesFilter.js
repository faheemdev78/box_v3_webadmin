'use client'
import React from 'react'
import PropTypes from 'prop-types';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { Col, Row } from 'antd';
import { geoZoneTypes, publishStatus } from '@_/configs';


export function ZonesFilter({ onUpdate, initialValues }) {
    const onSubmit = async(values) => {
        await onUpdate(values);
        return false;
    }

    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            //   mutators={{
            //       ...arrayMutators,
            //       onCatChange: (newValueArray, state, tools) => {
            //           let val = newValueArray[0];
            //           tools.changeValue(state, 'type', () => val)
            //       },
            //   }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    <form id="ZoneFilterForm" {...submitHandler(formargs)}><Row gutter={[10, 10]}>
                        {/* <Col><FormField type="text" name="title" placeholder="Title" allowClear /></Col> */}
                        <Col flex="150px"><FormField type="select" name="type" options={geoZoneTypes} allowClear /></Col>
                        <Col flex="100px"><FormField type="select" name="status" options={publishStatus} allowClear /></Col>
                        <Col><SubmitButton loading={submitting} label={'Search'} /></Col>
                    </Row></form>
                </>)

            }}
        />

    </>
    )
}
ZonesFilter.propTypes = {
    onUpdate: PropTypes.func.isRequired,
    initialValues: PropTypes.object,
}
