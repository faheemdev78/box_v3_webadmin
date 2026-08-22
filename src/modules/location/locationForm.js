'use client'
import React from 'react'
import { message, Row, Col, Divider } from 'antd';
import { Drawer, DevBlock, GMap } from '@/components';
import { string_to_slug } from '@/lib/utill';
import { publishStatus, locationTypes } from '@/configs';
import { __error } from '@/lib/consoleHelper';
import { useMutation } from '@apollo/client/react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, submitHandler } from '@/components/form';
import { LocationsDD } from '@/components/dropdowns';

import RECORD_ADD from '@/graphql/location/addLocation.graphql';
import RECORD_EDIT from '@/graphql/location/editLocation.graphql';

const icon_location_red = "/images/icon_location_red.png";
const defaultFields = {
    center: {
        coordinates: {
            lat: 31.52443022759592,
            lng: 74.35772741448616
        }
    },
}

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

const toFormValues = (record) => {
    if (!record?._id) return defaultFields;

    const coords = record?.center?.coordinates;
    const lat = Array.isArray(coords) ? coords[0] : coords?.lat;
    const lng = Array.isArray(coords) ? coords[1] : coords?.lng;

    return {
        ...record,
        center: {
            ...record.center,
            coordinates: {
                lat: lat ?? defaultFields.center.coordinates.lat,
                lng: lng ?? defaultFields.center.coordinates.lng,
            }
        }
    }
}

const FormComponent = ({ onSubmit, initialValues: record }) => {
    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={toFormValues(record)}
            mutators={{
                ...arrayMutators,
                updateCenter: (newValueArray, state, tools) => {
                    let coords = newValueArray[0]
                    tools.changeValue(state, 'center.coordinates', () => coords)
                },

            }}
            render={(formargs) => {
                const { submitting, form, values } = formargs;

                return (<>
                    <form id="LocationForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            <Col span={6}><FormField type="select" disabled={!!record?._id} options={locationTypes} name="type" label="Location Type" validate={rules.required} /></Col>
                            <Col span={6}><LocationsDD name="child_of" allowClear preload label="Parent" /></Col>
                            <Col span={6}><FormField type="text" name="title" label="Title" validate={rules.required} compact /></Col>
                            <Col span={6}><FormField onChange={filterSlug} type="text" name="code" label="Code (lhr)" validate={rules.required} compact /></Col>
                            <Col span={8}><FormField type="select" name="status" label="Status" options={publishStatus} validate={rules.required} compact /></Col>
                            <Col span={8}><FormField type="text" disabled name={`center.coordinates.lat`} label="Latitude" validate={rules.required} compact /></Col>
                            <Col span={8}><FormField type="text" disabled name={`center.coordinates.lng`} label="Longitude" validate={rules.required} compact /></Col>
                            <Col span={24}>
                                <Divider>Location Center</Divider>

                                <div style={{ width: '100%', height: 'calc(100vh - 320px)', position: "relative" }}>
                                    <GMap
                                        zoom={12}
                                        center={{ lat: values?.center?.coordinates?.lat, lng: values?.center?.coordinates?.lng }}
                                        onCenterChange={(coords) => {
                                            form.mutators.updateCenter(coords)
                                        }}
                                    />
                                    <div style={{ position: "absolute", top: "50%", zIndex: 100, width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.2)" }} />
                                    <div style={{ position: "absolute", top: 0, left: "50%", zIndex: 100, height: "100%", borderRight: "1px solid rgba(255, 255, 255, 0.2)" }} />
                                    <div style={{ position: "absolute", top: "50%", marginTop: "-40px", left: "50%", marginLeft: "-15px", zIndex: 100, }}><img src={icon_location_red} alt="" width="30px" /></div>
                                </div>
                            </Col>
                            <Col span={24} align="right"><SubmitButton loading={submitting} label={'Save'} /></Col>
                        </Row>

                        <DevBlock obj={values} title="values" />

                    </form>
                </>)

            }}
        />

    </>)
}

export const LocationForm = ({initialValues, ...props}) => {
    const { onClose, callback } = props;

    const [editLocation] = useMutation(RECORD_EDIT);
    const [addLocation] = useMutation(RECORD_ADD);

    const onSubmit = async (values) => {
        const _id = initialValues?._id;

        let input = {
            title: values.title,
            code: values.code,
            child_of: values.child_of,
            center: { 
                type: "Point",
                coordinates: [values.center.coordinates.lat, values.center.coordinates.lng]
             },
            type: values.type,
            status: values.status,
        };

        let resutls;

        if (_id) {
            Object.assign(input, { _id })
            delete input.type
            resutls = await _editLocation(input)
        }
        else {
            Object.assign(input, { 
                child_of: values.child_of,
                type: values.type
             })
            resutls = await _addLocation(input)
        }
        
        if (resutls && resutls?.error?.message) message.error(resutls.error.message);

        return false;
    }

    const _editLocation = async (input) => {
        let results = await editLocation({ variables: { input } })
            .then((r) => (r?.data?.editLocation))
        .catch(error => {
            console.log(__error("Error: "), error);
            return { error:{message:"Request Error!"}}
        });

        if (!results || results.error){
            return results;
        }

        message.success("Success");
        if (callback) callback('updated', results)
        onClose(results);
    }
    
    const _addLocation = async (input) => {
        let results = await addLocation({ variables: { input }})
            .then((r) => (r?.data?.addLocation))
            .catch(error => {
                console.log(__error("Error: "), error);
                return { error: { message:"Request Error" } }
            });

        if (!results || results.error) {
            return results;
        }

        message.success("Success");
        if (callback) callback('added', results)
        onClose(results);
    }

    return (
        <Drawer destroyOnHidden maskClosable={false}
            size='large' placement='right'
            onClose={props.onClose}
            open={props.open}
            footer={false}
            title={`${initialValues?._id ? 'Edit' : 'Add'} Location`}
        >
            <FormComponent key={initialValues?._id || 'new'} initialValues={initialValues} onSubmit={onSubmit} />
        </Drawer>
    )
}
