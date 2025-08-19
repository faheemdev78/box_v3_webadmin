import React, { useState } from 'react'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { Modal, Row, Col, Space, Alert, message } from 'antd';
import { Button, UserTypeDD } from '@_/components';
import { useLazyQuery, useMutation } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';

import UPDATE_PASSWORD from '@_/graphql/users/updateMyPassword.graphql'

export const UpdateUserPassword = ({ show, _id_user, onSuccess, onCancel }) => {
    const [error, setError] = useState(false)
    const [updateMyPassword, update_details] = useMutation(UPDATE_PASSWORD); // { data, loading, error }

    const onSubmit = async(values) => {
        setError(null);

        const input = {
            _id_user,
            password: values.password,
        }

        let resutls = await updateMyPassword({ variables: { input } }).then(r => (r?.data?.updateMyPassword))
        .catch(err => {
            console.log(__error("Error: "), err);
            return { error:{message: "Unable to update password"}}
        })

        if (!resutls || resutls.error) setError((resutls && resutls.error.message) || "Invalid response");
        else {
            message.success("Password updated")
            onSuccess(resutls);
        }

        return false;
    }

    return (<>
        <Modal title="Update Password" open={show} destroyOnHidden onCancel={onCancel} footer={false}>
            <FinalForm onSubmit={onSubmit}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        <form id="update_pwd_form" {...submitHandler(formargs)}>

                            {error && <Alert message={error} showIcon type='error' />}

                            <Space style={{ width: "100%" }} direction='vertical'>
                                <FormField type="password" name="password" label="New Password" validate={rules.required} />
                                <Row>
                                    <Col flex="auto"><Button onClick={onCancel} type="default">Cancel</Button></Col>
                                    <Col><SubmitButton color="orange" loading={submitting}>Save</SubmitButton></Col>
                                </Row>

                            </Space>

                        </form>

                    </>)

                }}
            />

        </Modal>
    </>)
}
