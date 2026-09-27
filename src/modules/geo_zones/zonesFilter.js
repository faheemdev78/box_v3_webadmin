'use client'
import React from 'react'
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@/components/form';
import { Col, Row, Space } from 'antd';
import { geoZoneTypes, publishStatus } from '@/configs';


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
                    <form id="ZoneFilterForm" {...submitHandler(formargs)}>
                        <div style={{ display:"flex", flexDirection:"row", gap:10 }}>
                            <FormField type="select" label="Zones" name="type" options={geoZoneTypes} allowClear width={200} />
                            <FormField type="select" label="Status" name="status" options={publishStatus} allowClear width={200} />
                            <SubmitButton loading={submitting} label={'Search'} style={{ marginTop:"25px" }} />
                        </div>
                    </form>
                </>)

            }}
        />

    </>
    )
}
// ZonesFilter.propTypes = {
//     onUpdate: PropTypes.func.isRequired,
//     initialValues: PropTypes.object,
// }
