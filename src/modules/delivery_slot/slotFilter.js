'use client'
import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types';
import { Row, Col, Card } from 'antd';
import { adminRoot, publishStatus, geoZoneTypes } from '@_/configs';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, submitHandler } from '@_/components/form';
import { ZonesDD } from '@_/components/dropdowns';



export function SlotFilter({ onSubmit }) {
    const onSubmitForm = async (values) => {
        let input = {}

        Object.keys(values).forEach(key => {
            if (key=='zone') Object.assign(input, { "zones._id": values[key]._id })
            else Object.assign(input, { [key]: values[key] })
        })

        onSubmit(input)
        return false;
    }

    return (<>
        <FinalForm onSubmit={onSubmitForm} initialValues={{}}
            mutators={{
                ...arrayMutators,
                onZoneChanged: (newValueArray, state, tools) => {
                    let val = newValueArray[0]
                    tools.changeValue(state, 'zone', () => val)
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    <form id="SlotFilterForm" {...submitHandler(formargs)}><>
                        <Row gutter={[10, 10]}>
                            <Col flex="150px">
                                <ZonesDD name="zone._id" label="Zone" preload allowClear compact
                                    filter={{ type: "delivery" }}
                                    onChange={(___, raw) => {
                                        form.mutators.onZoneChanged(raw)
                                    }}
                                />
                            </Col>
                            <Col flex="130px"><FormField type="select" options={publishStatus} name="status" label="Status" compact allowClear /></Col>
                            <Col style={{ paddingTop:"22px" }}><SubmitButton loading={submitting} label={'Search'} /></Col>
                        </Row>

                    </></form>
                </>)

            }}
        />

    </>)
}
SlotFilter.propTypes = {
    onSubmit: PropTypes.func,
    zone_id: PropTypes.string,
    store_id: PropTypes.string.isRequired,
}

