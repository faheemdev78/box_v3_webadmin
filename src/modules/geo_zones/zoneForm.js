'use client'
import React, { Component, useEffect, useRef, useState } from 'react'
import { Drawer, message, Row, Col, Divider, Alert, Space, Card } from 'antd';
import { Button, DevBlock, FileUploader, GMap, Loader } from '@/components';
import { catchApolloError, checkApolloRequestErrors, string_to_slug } from '@/lib/utill';
import { adminRoot, publishStatus, geoZoneTypes } from '@/configs';
import { __error, __yellow } from '@/lib/consoleHelper';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client/react';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@/components/form';
import { LocationsDD, ManufacturersDD, StoresDD } from '@/components/dropdowns';
import { useRouter } from 'next/navigation';

import RECORD_EDIT from '@/graphql/geo_zone/editGeoZone.graphql';
import RECORD_ADD from '@/graphql/geo_zone/addGeoZone.graphql';
import GEO_ZONE from '@/graphql/geo_zone/geoZone.graphql';
import GEO_ZONES from '@/graphql/geo_zone/geoZones.graphql';


function FormComp({ onSuccess, initialValues, store, ...props }) {
    const [error, setError] = useState(null)
    const [staticZones, setStaticZones] = useState(props.staticZones || [])

    const [editGeoZone, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addGeoZone, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [geoZones, zones_resutls] = useLazyQuery(GEO_ZONES, { fetchPolicy: "network-only" });

    const onSubmit = async (values) => {
        setError(null);

        const input = {
            title: values.title,
            type: values.type.value,
            polygon: {
                type: "Polygon",
                coordinates: values.polygon.coordinates
            },
            status: values.status,
            city: {
                _id: values.city._id,
                title: values.city.title,
                code: values.city.code,
                center: {
                    type: "Point",
                    coordinates: [
                        values.city.center.coordinates[0],
                        values.city.center.coordinates[1]
                    ]
                    // lat: values.city.center.lat,
                    // lng: values.city.center.lng,
                    // latitudeDelta: values.city.center.latitudeDelta,
                    // longitudeDelta: values.city.center.longitudeDelta,
                },
                type: values.city.type,
                status: values.city.status,
            },
            store: {
                _id: store._id,
                title: store.title,
                code: store.code
            },
        }

        var resutls;
        if (initialValues && initialValues._id){
            resutls = await editRecord({ ...input, _id: initialValues._id })
        }else{
            resutls = await addRecord(input)
        }

        if (!resutls || resutls.error) {
            setError((resutls && resutls?.error?.message) || "Invalid response!")
            return false;
        }

        message.success("Saved")
        if (onSuccess) onSuccess(resutls)

        return false;
    }

    async function addRecord(input){
        let resutls = await addGeoZone({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.addGeoZone }))
            .catch(catchApolloError)

        return resutls;
    }

    async function editRecord(input){
        let resutls = await editGeoZone({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.editGeoZone }))
            .catch(catchApolloError)

        return resutls;
    }

    async function loadRelatedZones({ city, type, _id }){
        if (!city || !store._id || !type) return;
        console.log(__yellow("loadRelatedZones()"))

        const filter = {
            "city._id": city._id,
            "store._id": store._id,
            "type": type.value,
        }
        if (_id) Object.assign(filter, { _id: { $ne: _id } })

        let results = await geoZones({ variables: { filter: JSON.stringify(filter) } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.geoZones }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error(results.error.message)
            return;
        }
        setStaticZones(results);
    }

    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            mutators={{
                ...arrayMutators,
                onCatChange: (newValueArray, state, tools) => {
                    let val = newValueArray[0];
                    tools.changeValue(state, 'type', () => val)
                },
                updateCenter: (newValueArray, state, tools) => {
                    let coords = newValueArray[0]
                    tools.changeValue(state, 'center', () => [coords])
                },
                onPolygonUpdate: (newValueArray, state, tools) => {
                    let coords = newValueArray[0]
                    tools.changeValue(state, 'polygon', () => ({ type: "polygon", coordinates: coords }))
                },
                onCityChanged: (newValueArray, state, tools) => {
                    let val = newValueArray[0]
                    tools.changeValue(state, 'city', () => val)
                },
                // onStoreChange: (newValueArray, state, tools) => {
                //     let val = newValueArray[0]
                //     tools.changeValue(state, 'store', () => val)
                // },

            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert title="Error" description={error} showIcon type='error' />}

                    {zones_resutls.loading && <Loader loading={true} />}

                    <form id="ZoneForm" {...submitHandler(formargs)}>
                        <Card>
                            <Row gutter={[10, 10]}>
                                <Col flex="auto"><FormField type="text" name="title" label="Title" validate={rules.required} /></Col>
                                <Col flex="200px">
                                    <FormField type="select" options={geoZoneTypes} disabled={(initialValues && initialValues._id)}
                                        onChange={(_type, raw) => {
                                            form.mutators.onCatChange(raw)
                                            loadRelatedZones({ ...values, type: raw })
                                        }}
                                        name="type.value" label="Type" validate={rules.required} />
                                </Col>
                                <Col flex="150px">
                                    <LocationsDD name="city._id" label="City" preload allowClear disabled={(initialValues && initialValues._id)}
                                        filter={{ type: "city" }}
                                        onChange={(___, raw) => {
                                            form.mutators.onCityChanged(raw)
                                            loadRelatedZones({ ...values, city: raw })
                                        }}
                                    /></Col>
                                {/* <Col flex="150px">
                                    <StoresDD name="store._id" label="Store" preload validate={rules.required} disabled={(initialValues && initialValues._id)}
                                        onChange={(___, raw) => {
                                            form.mutators.onStoreChange(raw)
                                            loadRelatedZones({ ...values, store: raw })
                                        }}
                                    />
                                </Col> */}
                                <Col flex="130px"><FormField type="select" options={publishStatus} name="status" label="Status" validate={rules.required} /></Col>
                            </Row>
                        </Card>

                        {(values.title && values.type && values.city && values.status) && <div style={{ width: '100%', height: 'calc(100vh - 300px)', position: "relative" }}>
                            <GMap zoom={12}
                                center={values?.city?.center?.coordinates ? { lat: values?.city?.center?.coordinates[0], lng: values?.city?.center?.coordinates[1] } : undefined }
                                staticZones={staticZones}
                                onPolygonUpdate={form.mutators.onPolygonUpdate}
                                editableShape={initialValues && initialValues.polygon}
                                enableDrawing={!(initialValues && initialValues._id)}
                                // center={{ lat: values?.center[0]?.lat, lng: values?.center[0]?.lng }}
                                onCenterChange={(coords) => form.mutators.updateCenter(coords)}
                            />
                        </div>}

                        <Row>
                            <Col flex="auto" />
                            <Col><SubmitButton loading={submitting} label={'Save'} /></Col>
                        </Row>
                        
                        <DevBlock obj={values} title="values" />
                    </form>
                </>)

            }}
        />

    </>)
}

function GeoZoneForm({ zone_id, store, ...props }) {
    const [initialValues, set_initialValues] = useState(null)
    const [error, setError] = useState(null)
    const router = useRouter()

    const [get_geoZone, { loading, data, called }] = useLazyQuery(GEO_ZONE, {
        fetchPolicy: "no-cache"
    });

    const fetchZone = async () => {
        setError(null)

        let resutls = await get_geoZone({
            variables: { _id: zone_id }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.geoZone }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            setError((resutls && resutls?.error?.message) || "Zone not found!")
            return;
        }

        // let coordinates = resutls.polygon.coordinates.slice();
        let inner_coordinates = resutls.polygon.coordinates[0].slice()
        inner_coordinates.pop()

        set_initialValues({
            ...resutls,
            type: { value: resutls.type },
            polygon: {
                ...resutls.polygon,
                coordinates: [inner_coordinates],
            }
        })
    }

    
    useEffect(() => {
        if (called || loading || !zone_id) return;
        fetchZone();
    }, [zone_id])

    const onSuccess = (val) => router.push(`${adminRoot}/store/${store._id}/zones`);

    if (error) return <Alert title="Error" description={error} type="error" showIcon />
    if (zone_id && (loading || !initialValues)) return <Loader loading={true} />
    if (!store._id) return <Alert title="Error" description={"Store ID not found!"} type='error' showIcon />

    return (<>
        <FormComp onSuccess={onSuccess} initialValues={initialValues} store={store} {...props} />
    </>)
}
export default GeoZoneForm
// GeoZoneForm.propTypes = {
//     zone_id: PropTypes.string,
//     store: PropTypes.object.isRequired,
//     onCancel: PropTypes.func.isRequired,
//     staticZones: PropTypes.array,
// }

