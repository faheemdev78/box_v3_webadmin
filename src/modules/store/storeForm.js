'use client'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Drawer, message, Row, Col, Divider, Alert, Space } from 'antd';
import { Button, DevBlock, FileUploader, GMap, Loader } from '@_/components';
import { sleep, string_to_slug } from '@_/lib/utill';
import { publishStatus, locationTypes, adminRoot } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { LocationsDD, ManufacturersDD, ZonesDD } from '@_/components/dropdowns';
import { useRouter } from 'next/navigation';

import RECORD_ADD from '@_/graphql/stores/addStore.graphql';
import RECORD_EDIT from '@_/graphql/stores/editStore.graphql';
import GET_STORE from '@_/graphql/stores/store.graphql';

const icon_location_red = "/images/icon_location_red.png";
const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

const FormComponent = ({ fields = {}, onSuccess, initialValues }) => {
    const [editStore, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addStore, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const router = useRouter()

    const [error, setError] = useState(false);

    const onSubmit = async (values) => {
        const _id = initialValues && initialValues?._id;
        
        setError(true);
        let input = {
            title: values.title,
            code: values.code,
            address: values.address,
            location: {
                _id: values.location._id,
                title: values.location.title,
                code: values.location.code,
                center: {
                    type: "Point",
                    coordinates: values.location.center.coordinates
                },
                type: values.location.type,
                status: values.location.status,
            },
            slug: values.slug,
            // zones: [GeoZoneReff_Input]
            description: values.description,
            status: values.status,
            center: {
                type: "Point",
                coordinates: [values.center.coordinates.lat, values.center.coordinates.lng]
            },
            seo_title: values.seo_title,
            seo_desc: values.seo_desc,
            // img: values.img,
            // img_thumb: values.img_thumb,

            status: values.status
        };

        var results;
        if (_id) {
            Object.assign(input, { _id })
            results = await _editStore(input)
        }
        else {
            Object.assign(input, {
                child_of: values.child_of,
                type: values.type
            })
            results = await _addStore(input)
        }

        if (results.error){
            message.error(results.error.message);
            setError(true);
        }else{
            message.success("Success");
            router.push(`${adminRoot}/store/${results._id}`)
        }

        return false;
    }

    const _editStore = async (input) => {
        let results = await editStore({ variables: { input } })
            .then((r) => (r?.data?.editStore))
            .catch(error => {
                console.log(__error("Error: "), error);
                return { error: { message: "Request Error!" } }
            });

        if (!results || results.error) return { error: { message: (results && results?.error?.message) || "Invalid response" }}
        return results;

        // router.push(`${adminRoot}/store/${results._id}`)
    }

    const _addStore = async (input) => {
        let results = await addStore({ variables: { input } })
            .then((r) => (r?.data?.addStore))
            .catch(error => {
                console.log(__error("Error: "), error);
                return { error: { message: "Request Error" } }
            });

        if (!results || results.error) return { error: { message: (results && results?.error?.message) || "Invalid response" }}
        return results;
    }



    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues || undefined}
            mutators={{
                ...arrayMutators,
                updateCenter: (newValueArray, state, tools) => {
                    let coords = newValueArray[0]
                    tools.changeValue(state, 'center.coordinates', () => coords)
                },
                onLocationChanged: (newValueArray, state, tools) => {
                    let val = newValueArray[0]
                    tools.changeValue(state, 'location', () => val)
                },

            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="StoreForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            {/* zones: [GeoZoneReff_Input] */}
                            <Col span={6}><FormField type="text" name="title" label="Title" validate={rules.required} compact /></Col>
                            <Col span={6}><FormField onChange={filterSlug} type="text" name="code" label="Code" validate={rules.required} compact /></Col>
                            <Col span={6}><FormField type="select" name="status" label="Status" options={publishStatus} validate={rules.required} compact /></Col>
                            <Col span={6}>
                                <LocationsDD 
                                    preload allowClear
                                    name="location._id" 
                                    label="Location" 
                                    filter={{ type: "city" }}
                                    onChange={(___, raw) => form.mutators.onLocationChanged(raw)}
                                />
                            </Col>
                            <Col span={24}>
                                <Divider>Location Center</Divider>
                                <Row gutter={[10]}>
                                    <Col span={12}><FormField type="text" disabled name={`center.coordinates.lat`} label="Latitude" validate={rules.required} compact /></Col>
                                    <Col span={12}><FormField type="text" disabled name={`center.coordinates.lng`} label="Longitude" validate={rules.required} compact /></Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <div style={{ width: '100%', height: '400px', position: "relative" }}>
                                    <GMap
                                        zoom={12}
                                        center={values?.center?.coordinates?.lat && { lat: values.center.coordinates.lat, lng: values.center.coordinates.lng }}
                                        onCenterChange={(coords) => {
                                            form.mutators.updateCenter(coords)
                                        }}
                                    >
                                        {/* <div style={{ backgroundColor: 'red' }}
                                            lat={values?.center?.coordinates?.lat} lng={values?.center?.coordinates?.lng}
                                        >Children</div> */}
                                    </GMap>
                                    <div style={{ position: "absolute", top: "50%", zIndex: 100, width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.2)" }} />
                                    <div style={{ position: "absolute", top: 0, left: "50%", zIndex: 100, height: "100%", borderRight: "1px solid rgba(255, 255, 255, 0.2)" }} />
                                    <div style={{ position: "absolute", top: "50%", marginTop: "-40px", left: "50%", marginLeft: "-15px", zIndex: 100, }}><img src={icon_location_red} alt="You" width="30px" /></div>
                                </div>
                            </Col>
                            <Col span={6}><FormField onChange={filterSlug} type="text" name="slug" label="Slug" validate={rules.required} compact /></Col>
                            <Col span={18}><FormField type="text" name="address" label="Address" validate={rules.required} compact /></Col>
                            <Col span={24}><FormField type="textarea" name="description" label="Description" compact /></Col>

                            <Col span={6}><FormField type="text" name="seo_title" label="SEO Title" /></Col>
                            <Col span={18}><FormField type="text" name="seo_desc" label="SEO Description" /></Col>
                            {/* img: String
                            img_thumb: String */}


                            <Col span={24} align="right"><SubmitButton loading={submitting} label={'Save'} /></Col>
                        </Row>

                        
                        <Row>
                            <Col span={12}><DevBlock obj={values} title="values" /></Col>
                            <Col span={12}><DevBlock obj={initialValues} title="initialValues" /></Col>
                        </Row>

                    </form>
                </>)

            }}
        />

    </>)
}

export const StoreForm = (props) => {
    const [fatelError, set_fatelError] = useState(false);
    const [error, setError] = useState(false);
    const [initialValues, set_initialValues] = useState(false);
    const [get_store, { loading, data, called }] = useLazyQuery(GET_STORE);

    useEffect(() => {
        if (called || loading || !props.store_id) return;
        fetchZone();
    }, [props.store_id])

    const fetchZone = async () => {
        setError(null)

        let resutls = await get_store({ variables: { _id: props.store_id } }).then(r => (r?.data?.store))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Store not found!")
            return;
        }

        // let coordinates = resutls.polygon.coordinates.slice();
        // let inner_coordinates = resutls.polygon.coordinates[0].slice()
        //     inner_coordinates.pop()

        set_initialValues({
            ...resutls,
            center: {
                ...resutls.center,
                coordinates: {
                    lat: resutls.center.coordinates[0],
                    lng: resutls.center.coordinates[1],
                }
            },
            // category: {
            //     value: resutls.category,
            // },
            // polygon: {
            //     ...resutls.polygon,
            //     coordinates: [inner_coordinates],
            // }
            // city: {

            // }
        })
    }

    const onSuccess = () => {

    }
    
    if (fatelError) return <Alert message={fatelError} type="error" showIcon />
    if (props.store_id && (loading || !initialValues)) return <Loader loading={true} />
    
    return (<>
        {error && <Alert message={error} showIcon type='error' />}
        <FormComponent {...props} initialValues={initialValues} onSuccess={onSuccess} />
    </>)
}
StoreForm.propTypes = {
    // params: PropTypes.object,
}
