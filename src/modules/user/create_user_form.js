import React, { useState } from 'react'
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { Modal, Row, Col, Space, Alert } from 'antd';
import { Button, DevBlock, UserTypeDD } from '@_/components';
import { useLazyQuery, useMutation } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { publishStatus } from '@_/configs';
import { useSelector } from 'react-redux';
import { getAuth } from '@_/store/slices/auth';

import ADD_USER from '@_/graphql/users/addUser.graphql'
import EDID_USER from '@_/graphql/users/editUser.graphql'

export const CreateUserForm = ({ show, onSuccess, onCancel, initialValues }) => {
    const [addUser, add_details] = useMutation(ADD_USER); // { data, loading, error }
    const [editUser, edit_details] = useMutation(EDID_USER); // { data, loading, error }

    const authState = useSelector(getAuth);
    
    const [error, setError] = useState(false)

    const onSubmit = async(values) => {
        setError(null);

        const input = {
            acc_type: values.acc_type,
            fname: values.name,
            email: values.email,
            status: values.status,
            acc_group: 'manager',
        }
        if (values.password) Object.assign(input, { password: values.password })

        var resutls;

        if (initialValues._id){
            Object.assign(input, { _id: initialValues._id })
            
            resutls = await editUser({ variables: { input } }).then(r => (r?.data?.editUser))
                .catch(err => {
                    console.log(__error("Error: "), err);
                    return { error: { message: "Unable to save user" } }
                })
        }else{
            resutls = await addUser({ variables: { input } }).then(r => (r?.data?.addUser))
            .catch(err=>{
                console.log(__error("Error: "), err);
                return { error:{message: "Unable to save user"}}
            })
        }


        if (!resutls || resutls.error) setError((resutls && resutls.error.message) || "Invalid response");
        else onSuccess(resutls);

        return false;
    }

    return (<Modal open={show} destroyOnHidden footer={false} onCancel={onCancel}>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}

            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    <form id={"add_user_form"} {...submitHandler(formargs)}><>
                        {error && <Alert message={error} type='error' showIcon />}

                        <Row gutter={[5, 5]}>
                            <Col span={24}><FormField type="text" name="name" label="Name" validate={rules.required} /></Col>
                            <Col span={12}><UserTypeDD showSearch={false} preload name="acc_type" label="Type" validate={rules.required} /></Col>
                            <Col span={12}><FormField type="select" name="status" options={publishStatus} label="Status" validate={rules.required} /></Col>
                            <Col span={12}><FormField type="email" name="email" label="Email" validate={rules.required} /></Col>
                            <Col span={12}><FormField type="password" name="password" label="Password" validate={values._id ? undefined : rules.required} /></Col>
                        </Row>

                        <div style={{ height: "20px" }} />
                        <Row>
                            <Col flex="auto"><Button onClick={onCancel} type="default">Cancel</Button></Col>
                            <Col><SubmitButton color="orange" loading={submitting}>Save</SubmitButton></Col>
                        </Row>

                        <DevBlock obj={values} title="values" />
                    </></form>

                </>)

            }}
        />

    </Modal>)
}
