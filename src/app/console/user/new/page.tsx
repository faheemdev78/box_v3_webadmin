'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { useRouter } from 'next/navigation';
import { publishStatus, gendersArray, userAccountGroups, adminRoot } from '@_/configs';
import Alert from 'antd/es/alert/Alert';
import { Card, Col, message, Row, Space } from 'antd';
import { AccTypesDD, StoresDD } from '@_/components/dropdowns';
import { DevBlock } from '@_/components';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';

import RECORD_ADD from '@_/graphql/users/addUser.graphql'
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';


export default function UserForm (props) {
    const [error, setError] = useState(false);
    const router = useRouter()

    // const [get_store, { loading, data, called }] = useLazyQuery(GET_STORE);
    const [addUser, add_details] = useMutation(RECORD_ADD); // { data, loading, error }

    const onSubmit = async (values) => {
        setError(null)

        let input = {
            fname: values.fname,
            mname: values.mname,
            lname: values.lname,
            email: values.email,
            password: values.password,
            acc_type: values.acc_type.acc_type,
            acc_group: String(values.acc_type.acc_type).indexOf("admin") > -1 ? "manager" : "employee",
            status: values.status,
            note: values.note,
        };

        if (String(values.acc_type.acc_type).indexOf("admin") < 0){
            Object.assign(input, { store: { _id: values.store._id } })
        }

        if (values.password && (values.password != values.confirm_pwd)) {
            message.error("Password missmatch")
            return;
        }
        else if (values.password && (values.password == values.confirm_pwd)) Object.assign(input, { password: values.password });

        const resutls = await addUser({ variables: { input }})
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.addUser }))
            .catch(error => {
                console.log(__error("Error: "), error)
                return { error: { message: error.message || "Query Error" } }
            });

        if (!resutls || resutls.error) {
            setError((resutls && resutls.error.message) || "Invalid Response")
            return true;
        }
        
        message.success("Saved");
        router.push(`${adminRoot}/users`)
        return false;
    }

    return (<>
        <PageHeader title="Add New Page"></PageHeader>

        <Page>
            <Card>
                <FinalForm onSubmit={onSubmit} initialValues={{}}
                    mutators={{
                        ...arrayMutators,
                        onTypeChanged: (newValueArray, state, tools) => {
                            let val = newValueArray[0]
                            tools.changeValue(state, 'acc_type', () => val)
                        },
                        onStoreChanged: (newValueArray, state, tools) => {
                            let val = newValueArray[0]
                            tools.changeValue(state, 'store', () => val)
                        },

                }}
                    render={(formargs) => {
                        const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                        return (<>
                            {error && <Alert message={error} showIcon type='error' />}
                            <form id="NewUserForm" {...submitHandler(formargs)}>
                            
                                <Space style={{ width:"100%"}} direction='vertical' size={10}>

                                    <div><Space>
                                        <AccTypesDD
                                            onChange={(___, raw) => form.mutators.onTypeChanged(raw)}
                                            label="Account Type" preload name="acc_type._id" validate={rules.required}
                                        />
                                        <FormField type="select" name="status" label="Status" className={values.status == 'enabled' ? "active" : "inactive"} options={publishStatus} validate={rules.required} />
                                        {(values?.acc_type?._id && String(values?.acc_type?.acc_type).indexOf("admin") < 0) && <>
                                            <StoresDD onChange={(___, raw) => form.mutators.onStoreChanged(raw)} preload name="store._id" label="Store" validate={rules.required} />
                                        </>}
                                    </Space></div>

                                    {values?.acc_type?._id && <>
                                        <div><Space>
                                            <FormField type="text" name="fname" label="First Name" validate={rules.required} />
                                            <FormField type="text" name="lname" label="Last Name" />
                                            <FormField type="select" name="gender" label="Gender" options={gendersArray} validate={rules.required} />
                                            <FormField type="text" name="email" label="Email Address (Login Use)" validate={[rules.required, rules.isEmail]} />
                                            <FormField type="text" name="phone" label="Phone" placeholder="Mobile number" validate={[rules.required, rules.minChar(4)]} />
                                        </Space></div>

                                        <div><Space>
                                            <FormField type="password" name="password" label="Password" validate={rules.required} />
                                            <FormField type="password" name="confirm_pwd" label="Confirm Password" validate={[rules.required, rules.isEqual(values.password, 'Password missmatched')]} />
                                        </Space></div>

                                        <FormField type="textarea" name="note" label="Note" placeholder="Notes" />
                                        <div style={{ padding:"20px" }} align="right"><SubmitButton loading={submitting} label={'Save'} /></div>
                                    </>}
                                </Space>

                                <DevBlock obj={values} title="values" />

                            </form>
                        </>)

                    }}
                />
            </Card>
        </Page>

    </>)
}

