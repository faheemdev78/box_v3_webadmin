'use client'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Drawer, message, Row, Col, Divider, Alert, Space } from 'antd';
import { Button, DevBlock, FileUploader, GMap, Loader } from '@_/components';
import { checkApolloRequestErrors, sleep, string_to_slug } from '@_/lib/utill';
import { publishStatus, locationTypes, adminRoot, userStatus } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { LocationsDD, ManufacturersDD, UserTypeDD, ZonesDD } from '@_/components/dropdowns';
import { useRouter } from 'next/navigation';

import GET_RECORD from '@_/graphql/users/user.graphql';
import RECORD_EDIT from '@_/graphql/users/editStoreStaff.graphql';


const FormComponent = ({ onSuccess, initialValues }) => {
    const [editStoreStaff, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    // const router = useRouter()

    const [error, setError] = useState(false);

    const onSubmit = async (values) => {
        setError(null);

        let input = {
            _id_store: initialValues.store._id,
            _id: initialValues._id,
            name: values.name,
            email: values.email,
            phone: values.phone,
            acc_type: values.acc_type,
        };

        let results = await editStoreStaff({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.editStoreStaff }))
            .catch(error => {
                console.log(__error("Error: "), error);
                return { error: { message: "Request Error!" } }
            });

        if (results.error){
            message.error(results.error.message);
            setError(results.error.message);
            return;
        }
        message.success("Saved");
        // router.push(`${adminRoot}/store/${results._id}`)
        
        if (onSuccess) onSuccess(results)
        return results;
    }


    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues || undefined}
            // mutators={{
            //     ...arrayMutators,
            //     onLocationChanged: (newValueArray, state, tools) => {
            //         let val = newValueArray[0]
            //         tools.changeValue(state, 'location', () => val)
            //     },
            // }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="StaffForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            <Col span={12}><FormField type="text" name="name" label="Name" validate={rules.required} /></Col>
                            <Col span={12}><UserTypeDD name="acc_type" label="Account Type" validate={rules.required} preload /></Col>
                            <Col span={12}><FormField type="email" name="email" label="Email" validate={[rules.required, rules.isEmail]} /></Col>
                            <Col span={12}><FormField type="text" name="phone" label="Phone" validate={rules.required} /></Col>
                            {/* <Col span={6}><FormField type="select" name="acc_type" label="Account Type" options={userAccount} validate={rules.required} compact /></Col> */}

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

export const StaffEditForm = ({ user_id, onSuccess, ...props }) => {
    const [fatelError, set_fatelError] = useState(false);
    const [error, setError] = useState(false);
    const [initialValues, set_initialValues] = useState(props.initialValues || false);
    const [get_user, { loading, data, called }] = useLazyQuery(GET_RECORD);

    useEffect(() => {
        if (called || loading || !user_id || initialValues) return;
        fetchData();
    }, [user_id])

    const fetchData = async () => {
        setError(null)

        let resutls = await get_user({ variables: { _id: user_id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.user }))
            .catch(err => {
                console.log(__error("Query Error: "), err)
                return { error: { message: "Query Error" } }
            })

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Store not found!")
            return;
        }

        set_initialValues({
            ...resutls,
            // center: {
            //     ...resutls.center,
            //     coordinates: {
            //         lat: resutls.center.coordinates[0],
            //         lng: resutls.center.coordinates[1],
            //     }
            // },
        })
    }

    
    if (fatelError) return <Alert message={fatelError} type="error" showIcon />
    if (user_id && (loading || !initialValues)) return <Loader loading={true} />
    
    return (<>
        {error && <Alert message={error} showIcon type='error' />}
        <FormComponent {...props} initialValues={initialValues} onSuccess={onSuccess} />
    </>)
}
// StaffEditForm.propTypes = {
//     onSuccess: PropTypes.func,
//     initialValues: PropTypes.object,
//     // params: PropTypes.object,
// }
