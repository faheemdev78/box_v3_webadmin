'use client'
import React, { useState } from 'react'
import { __error } from '@/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@/components/form';
import { useRouter } from 'next/navigation';
import { publishStatus, gendersArray, userAccountGroups, adminRoot, userStatus } from '@/configs';
import Alert from 'antd/es/alert/Alert';
import { Card, Col, message, Row, Space } from 'antd';
import { AccTypesDD, StoresDD } from '@/components/dropdowns';
import { DevBlock } from '@/components';
import { PageHeader } from '@/template';
import { Page } from '@/template/page';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import RECORD_ADD from '@/graphql/users/addAdminUser.graphql'
import RECORD_EDIT from '@/graphql/users/editAdminUser.graphql'


function UserForm () {
    const [error, setError] = useState(false);
    const router = useRouter()

    const [addUser, add_details] = useMutation<any>(RECORD_ADD); // { data, loading, error }

    const onSubmit = async (values: any) => {
        setError(null as any)

        let input = {
            _id_store: values?.store?._id,
            acc_type: values.acc_type,
            status: values.status,
            name: values.name,
            email: values.email,
            phone: values.phone,
            password: values.password,
            notes: values.notes,
        };

        if (values.password && (values.password != values.confirm_pwd)) {
            message.error("Password missmatch")
            return;
        }
        else if (values.password && (values.password == values.confirm_pwd)) Object.assign(input, { password: values.password });

        const resutls = await addUser({ variables: { input }})
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.addUser }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            setError((resutls && resutls.error.message) || "Invalid Response")
            return true;
        }
        
        message.success("Saved");
        router.push(`${adminRoot}/users`)
        return false;
    }

    return (<>
        <PageHeader title="Add New User"></PageHeader>

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
                            {error && <Alert title="Error" description={error} showIcon type='error' />}
                            <form id="NewUserForm" {...submitHandler(formargs)}>
                                 <Space style={{ width: "100%" }} orientation='vertical' size={10}>
                                    <div><Space>
                                        {/* <AccTypesDD preload
                                            onChange={(___: any, raw: any) => form.mutators.onTypeChanged(raw)}
                                            label="Account Type" name="acc_type._id" 
                                            validate={rules.required}
                                        /> */}
                                        <FormField type="select" name="acc_type" label="Account Type" 
                                            validate={rules.required}
                                            options={[
                                                { value: "admin", label:"Admin" }
                                            ]} 
                                        />
                                        <FormField type="select" name="status" label="Status" className={values.status == 'enabled' ? "active" : "inactive"} options={userStatus} validate={rules.required} />
                                        {/* {(values?.acc_type?._id && String(values?.acc_type?.acc_type).indexOf("admin") < 0) && <>
                                            <StoresDD onChange={(___: any, raw: any) => form.mutators.onStoreChanged(raw)} preload name="store._id" label="Store" validate={rules.required} />
                                        </>} */}
                                    </Space></div>

                                    {values?.acc_type && <>
                                        <div><Space>
                                            <FormField type="text" name="name" label="Name" validate={rules.required} />
                                            <FormField type="text" name="email" label="Email Address (Login Use)" validate={[rules.required, rules.isEmail]} />
                                            <FormField type="text" name="phone" label="Phone" placeholder="Mobile number" validate={[rules.required, rules.minChar(4)]} />
                                        </Space></div>

                                        <div><Space>
                                            <FormField type="password" name="password" label="Password" validate={rules.required} />
                                            <FormField type="password" name="confirm_pwd" label="Confirm Password" validate={[rules.required, rules.isEqual(values.password, 'Password missmatched')]} />
                                        </Space></div>

                                        <FormField type="textarea" name="notes" label="Notes" placeholder="Notes" />
                                        <div style={{ padding:"20px", textAlign:"right" }}><SubmitButton loading={submitting} label={'Save'} /></div>
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

export default UserForm
