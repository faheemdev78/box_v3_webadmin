'use client'
import React, { Component, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types';
import { Drawer, message, Row, Col, Divider, Alert, Space, Card } from 'antd';
import { Button, DevBlock, FileUploader, GMap, Loader } from '@_/components';
import { string_to_slug } from '@_/lib/utill';
import { adminRoot, publishStatus, geoZoneTypes } from '@_/configs';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { UsersDD, ZonesDD } from '@_/components/dropdowns';
import { useRouter } from 'next/navigation';

import RECORD_EDIT from '@_/graphql/vehicles/editVehicle.graphql';
import RECORD_ADD from '@_/graphql/vehicles/addVehicle.graphql';
import RECORD_GET from '@_/graphql/vehicles/vehicle.graphql';


function FormComp({ initialValues, ...props}) {
    const [error, setError] = useState(false);
    const router = useRouter()

    // const [get_store, { loading, data, called }] = useLazyQuery(GET_STORE);
    const [addVehicle, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [editVehicle, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    const onSubmit = async (values) => {
        setError(null)

        let input = {
            title: values.title,
            registration_no: values.registration_no,
            zones: values.zones.map(zone => ({
                _id_zone: zone._id_zone,
                title: zone.title,
                category: zone.category,
                // polygon: GeoPolygon_Input
                city: {
                    _id: zone.city._id,
                    title: zone.city.title,
                    code: zone.city.code,
                    // child_of: ID
                    center: {
                        type: zone.city.center.type,
                        coordinates: zone.city.center.coordinates,
                    },
                    type: zone.city.type,
                    status: zone.city.status,
                },
                status: zone.status,
            })),
            status: values.status,
            drivers: values?.drivers?.map(o => ({
                _id: o._id,
                name: o.name
            })),
            box_cpacity: Number(values.box_cpacity),
            store: {
                _id: props.store._id,
                title: props.store.title,
                code: props.store.code,
                // center: GeoPoint_Input
            },
        };

        var resutls;
        if (initialValues && initialValues._id){
            resutls = await _editVehicle({ ...input, _id: initialValues._id })
        }
        else {
            resutls = await _addVehicle(input)
        }

        if (!resutls || resutls.error) {
            setError((resutls && resutls.error.message) || "Invalid Response")
            return true;
        }

        message.success("Saved");
        router.push(`${adminRoot}/store/${resutls.store._id}/vehicles`)
        return false;
    }

    async function _addVehicle(values){
        let input = {...values}
        const resutls = await addVehicle({ variables: { input } }).then((r) => (r?.data?.addVehicle))
            .catch(error => {
                console.log(__error("Error: "), error)
                return { error: { message: error.message || "Request Error" } }
            });

        return resutls;
    }

    async function _editVehicle(values){
        let input = { ...values }
        // delete input.store;

        const resutls = await editVehicle({ variables: { input } }).then((r) => (r?.data?.editVehicle))
            .catch(error => {
                console.log(__error("Error: "), error)
                return { error: { message: error.message || "Request Error" } }
            });

        return resutls;
    }

    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            mutators={{
                ...arrayMutators,
                onZoneSelect: (newValueArray, state, tools) => {
                    let val = newValueArray[0]
                    let zones = state?.formState?.values?.zones?.slice() || [];
                    zones.push({
                        ...val,
                        _id_zone: val._id,
                    })
                    tools.changeValue(state, 'zones', () => zones)
                },
                onZoneDeSelect: (newValueArray, state, tools) => {
                    let val = newValueArray[0]
                    let zones = state?.formState?.values?.zones?.slice() || [];
                    zones = zones.filter(o => !(o._id_zone == val.value))
                    tools.changeValue(state, 'zones', () => zones)
                },
                onDriverSelect: (newValueArray, state, tools) => {
                    let val = newValueArray[0]
                    let drivers = state?.formState?.values?.drivers?.slice() || [];
                    drivers.push(val)
                    tools.changeValue(state, 'drivers', () => drivers)
                },
                onDriverDeSelect: (newValueArray, state, tools) => {
                    let val = newValueArray[0]
                    let drivers = state?.formState?.values?.drivers?.slice() || [];
                    drivers = drivers.filter(o => !(o._id == val.value))
                    tools.changeValue(state, 'drivers', () => drivers)
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="NewVehicleForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            <Col span={6}><FormField type="text" name="title" label="Title" validate={rules.required} /></Col>
                            <Col span={6}><FormField type="text" name="registration_no" label="Registration #" validate={rules.required} /></Col>
                            <Col span={6}><FormField type="select" name="status" label="Status" className={values.status == 'online' ? "active" : "inactive"} options={publishStatus} validate={rules.required} /></Col>
                            <Col span={6}><FormField type="number" name="box_cpacity" label="Box Cpacity" validate={rules.required} /></Col>
                            <Col span={24}><UsersDD
                                onSelect={(___, raw) => form.mutators.onDriverSelect(raw)}
                                onDeselect={(___, raw) => form.mutators.onDriverDeSelect(raw)}
                                filter={{ acc_type: "driver" }} preload mode="multiple" name="drivers_ids" label="Drivers" validate={rules.required} /></Col>
                            <Col span={24}><ZonesDD
                                onSelect={(___, raw) => form.mutators.onZoneSelect(raw)}
                                onDeselect={(___, raw) => form.mutators.onZoneDeSelect(raw)}
                                filter={{ type: "service" }} preload mode="multiple" label="zones" name="zones_ids" validate={rules.required} /></Col>
                            <Col span={24}><SubmitButton loading={submitting} label={'Save'} /></Col>
                        </Row>

                        <FormField type="hidden" name="zones" />
                        <FormField type="hidden" name="drivers" />

                        <DevBlock obj={values} title="values" />

                    </form>
                </>)

            }}
        />

    </>)
}


export function VehicleForm({ store, ...props }) {
    const [initialValues, set_initialValues] = useState(null)
    const [error, setError] = useState(null)
    const router = useRouter()

    const [get_vehicle, { loading, data, called }] = useLazyQuery(RECORD_GET);

    useEffect(() => {
        if (called || loading || !props?.initialValues?._id) return;
        fetchData();
    }, [props.initialValues])

    const fetchData = async () => {
        setError(null)

        let resutls = await get_vehicle({ 
                variables: { _id: props.initialValues._id },
                fetchPolicy: "no-cache"
        }).then(r => (r?.data?.vehicle))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            setError((resutls && resutls?.error?.message) || "Vehicle not found!")
            return;
        }

        Object.assign(resutls, {
            zones_ids: resutls?.zones?.map(o => (o._id_zone)),
            drivers_ids: resutls?.drivers?.map(o=>(o._id)),
        })


        set_initialValues(resutls)
    }

    const onSuccess = (val) => router.push(`${adminRoot}/store/${store_id}/vehicles`);

    if (error) return <Alert message={error} type="error" showIcon />
    if (props?.initialValues?._id && (loading || !initialValues)) return <Loader loading={true} />
    if (!store || !store._id) return <Alert message={"Store ID not found!"} type='error' showIcon />

    return (<>
        <FormComp {...props} onSuccess={onSuccess} store={store} initialValues={initialValues} />
    </>)
}
VehicleForm.propTypes = {
    store: PropTypes.object.isRequired,
    initialValues: PropTypes.object,
    onSuccess: PropTypes.func.isRequired,
}

