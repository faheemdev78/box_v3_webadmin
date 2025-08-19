'use client'

import React, { useState } from 'react'
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { useRouter } from 'next/navigation';
import { userStatus, adminRoot } from '@_/configs';
import Alert from 'antd/es/alert/Alert';
import { Card, Col, message, Row, Space } from 'antd';
import { AccTypesDD } from '@_/components/dropdowns';
import { DevBlock } from '@_/components';
import { PageHeader } from '@_/template';
import StoreWrapper from '@_/modules/store/storeWrapper';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

import RECORD_ADD from '@_/graphql/users/addStoreStaff.graphql'
import EDIT_ADD from '@_/graphql/users/editStoreStaff.graphql'


function StaffForm ({ store }) {
    const [error, setError] = useState(false);
    const router = useRouter()

    // const [get_store, { loading, data, called }] = useLazyQuery(GET_STORE);
    const [addStoreStaff, add_details] = useMutation(RECORD_ADD); // { data, loading, error }

    const onSubmit = async (values) => {
        setError(null)

        let input = {
            _id_store: store._id,
            acc_type: values.acc_type.acc_type,
            status: values.status,
            name: values.name,
            email: values.email,
            phone: values.phone,
            password: values.password,
            notes: values.notes
        };

        if (values.password && (values.password != values.confirm_pwd)) {
            message.error("Password missmatch")
            return;
        }
        else if (values.password && (values.password == values.confirm_pwd)) Object.assign(input, { password: values.password });

        const resutls = await addStoreStaff({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.addStoreStaff }))
            .catch(error => {
                console.log(__error("Error: "), error)
                return { error: { message: error.message || "Query Error" } }
            });

        if (!resutls || resutls.error) {
            setError((resutls && resutls.error.message) || "Invalid Response")
            return true;
        }
        
        message.success("Saved");
        router.push(`${adminRoot}/store/${resutls.store._id}/staff`)
        return false;
    }

    return (<>
        <PageHeader title="Add new Staff" sub={` to: ${store.title}`} />
        
        <Card>
            <FinalForm onSubmit={onSubmit} initialValues={{}}
                mutators={{
                    ...arrayMutators,
                    onTypeChanged: (newValueArray, state, tools) => {
                        let val = newValueArray[0]
                        tools.changeValue(state, 'acc_type', () => val)
                    },
                }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {error && <Alert message={error} showIcon type='error' />}
                        <form id="NewUserForm" {...submitHandler(formargs)}>

                            <Space style={{ width: "100%" }} direction='vertical' size={10}>

                                <div><Space>
                                    <AccTypesDD
                                        // resultParser={(options) => options.filter(o=>!(o.acc_type=='admin'))}
                                        filter={{ acc_type: { $ne: "admin" } }}
                                        onChange={(___, raw) => form.mutators.onTypeChanged(raw)}
                                        label="Account Type" preload name="acc_type._id" validate={rules.required}
                                    />
                                    <FormField type="select" name="status" label="Status" className={values.status == 'active' ? "active" : "inactive"} options={userStatus} validate={rules.required} />
                                </Space></div>

                                {values?.acc_type?._id && <>
                                    <div><Space>
                                        <FormField type="text" name="name" label="Full Name" validate={rules.required} />
                                        {/* <FormField type="select" name="gender" label="Gender" options={gendersArray} validate={rules.required} /> */}
                                        <FormField type="text" name="email" label="Email Address (Login Use)" validate={[rules.required, rules.isEmail]} />
                                        <FormField type="text" name="phone" label="Phone" placeholder="Mobile number" validate={[rules.required, rules.minChar(4)]} />
                                    </Space></div>

                                    <div><Space>
                                        <FormField type="password" name="password" label="Password" validate={rules.required} />
                                        <FormField type="password" name="confirm_pwd" label="Confirm Password" validate={[rules.required, rules.isEqual(values.password, 'Password missmatched')]} />
                                    </Space></div>

                                    <FormField type="textarea" name="note" label="Note" placeholder="Notes" />
                                    <div style={{ padding: "20px" }} align="right"><SubmitButton loading={submitting} label={'Save'} /></div>
                                </>}
                            </Space>

                            <DevBlock obj={values} title="values" />

                        </form>
                    </>)

                }}
            />

        </Card>

    </>)
}

export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<StaffForm store={store} {...props} />)} />)
}

