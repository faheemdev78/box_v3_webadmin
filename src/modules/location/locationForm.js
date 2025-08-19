'use client'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Divider, Alert, Space } from 'antd';
import { Drawer, Button, DevBlock, FileUploader, GMap, Loader } from '@_/components';
import { sleep, string_to_slug } from '@_/lib/utill';
import { publishStatus, locationTypes } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
// import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { LocationsDD, ManufacturersDD } from '@_/components/dropdowns';
// import icon_location_red from 'assets/icon_location_red.png';

import RECORD_ADD from '@_/graphql/location/addLocation.graphql';
import RECORD_EDIT from '@_/graphql/location/editLocation.graphql';
import GET_LOCATION from '@_/graphql/location/location.graphql';

const icon_location_red = "/images/icon_location_red.png";
const defaultFields = {
    // type: "Point",
    center: {
        coordinates: {
            lat: 31.52443022759592,
            lng: 74.35772741448616
        }
    }, 
}

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

const FormComponent = ({ onSubmit, ...props }) => {
    const [error, setError] = useState(false);
    const [initialValues, set_initialValues] = useState(false);

    const [get_location, location_results] = useLazyQuery(GET_LOCATION, {/*{ variables: { filter: JSON.stringify({}) } }*/ });


    useEffect(() => {
        if (!props?.initialValues?._id || location_results.called || location_results.loading) return;
        fetchInitialValues()

        return () => {
            set_initialValues(null)
        };
    }, [props.initialValues])

    const fetchInitialValues = async () => {
        let results = await get_location({ variables: { _id: props.initialValues._id } }).then(r => (r?.data?.location))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "No records found!" } }
            })

        if (!results || results.error) {
            setError((results && results.error.message) || "Invalid Response!")
            return;
        }
        set_initialValues({
            ...results,
            center: {
                ...results.center,
                coordinates: {
                    lat: results.center.coordinates[0],
                    lng: results.center.coordinates[1],
                }
            }
        })
    }

    if (error) return <Alert message={error} showIcon type='error' />
    if (props?.initialValues?._id && !initialValues) return <Loader loading={true} />

   
    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues || defaultFields}
            mutators={{
                ...arrayMutators,
                updateCenter: (newValueArray, state, tools) => {
                    let coords = newValueArray[0]
                    tools.changeValue(state, 'center.coordinates', () => coords)
                },

            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {/* {error && <Alert message={error} showIcon type='error' />} */}
                    <form id="LocationForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            <Col span={6}><FormField type="select" disabled={!!(props?.initialValues?._id)} options={locationTypes} name="type" label="Location Type" validate={rules.required} /></Col>
                            <Col span={6}><LocationsDD name="child_of" allowClear preload label="Parent" /></Col>
                            <Col span={6}><FormField type="text" name="title" label="Title" validate={rules.required} compact /></Col>
                            <Col span={6}><FormField onChange={filterSlug} type="text" name="code" label="Code (lhr)" validate={rules.required} compact /></Col>
                            <Col span={8}><FormField type="select" name="status" label="Status" options={publishStatus} validate={rules.required} compact /></Col>
                            <Col span={8}><FormField type="text" disabled name={`center.coordinates.lat`} label="Latitude" validate={rules.required} compact /></Col>
                            <Col span={8}><FormField type="text" disabled name={`center.coordinates.lng`} label="Longitude" validate={rules.required} compact /></Col>
                            {/* <Col span={24}><Divider>Location Center</Divider></Col> */}
                            <Col span={24}>
                                <Divider>Location Center</Divider>
                                <div style={{ width: '100%', height: 'calc(100vh - 320px)', position: "relative" }}>
                                    <GMap
                                        zoom={12}
                                        center={{ lat: values?.center?.coordinates?.lat, lng: values?.center?.coordinates?.lng }}
                                        onCenterChange={(coords) => {
                                            console.log("onCenterChange()", coords)
                                            form.mutators.updateCenter(coords)
                                        }}
                                    >
                                        {/* <div style={{ backgroundColor: 'red' }}
                                            lat={values?.center?.coordinates?.lat}
                                            lng={values?.center?.coordinates?.lng}
                                        >Children</div> */}
                                    </GMap>
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
    const [error, setError] = useState(false);
    // const [initialValues, set_initialValues] = useState(false);

    const [editLocation, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    const [addLocation, add_details] = useMutation(RECORD_ADD); // { data, loading, error }

    const onSubmit = async (values) => {
        const _id = initialValues && initialValues?._id;

        let input = {
            title: values.title,
            code: values.code,
            child_of: values.child_of,
            center: { 
                type: "Point", // Restrict to GeoJSON Point type
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
            // message.error((results || results?.error?.message) || "Invalid response")
            // return false;
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
            // message.error((results || results?.error?.message) || "Invalid response")
            // return false;
        }

        message.success("Success");
        if (callback) callback('added', results)
        onClose(results);
    }

    return (
        <Drawer height={'100%'} destroyOnHidden maskClosable={false} placement="top"
            onClose={props.onClose}
            open={props.open}
            footer={false}
            // footer={<>
            //     <span></span>
            //     <Button loading={loading} type="primary" onClick={() => {
            //         document.getElementById('ProdCatForm').dispatchEvent(new Event('submit', { cancelable: true }))
            //     }}>Save</Button>
            // </>}
            title={`${props?.initialValues?._id ? 'Edit' : 'Add'} Location`}
        ><>
            {error && <Alert message={error} showIcon type='error' />}

                <FormComponent {...props} initialValues={initialValues} onSubmit={onSubmit} />
        </>
        </Drawer>
    )
}
LocationForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    callback: PropTypes.func,
    initialValues: PropTypes.object,
}
