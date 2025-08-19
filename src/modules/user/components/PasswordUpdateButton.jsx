import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { useMutation } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { Alert, Col, Modal, Row, message } from 'antd';
import { Button } from '@_/components';


import UPDATE_PWD from '@_/graphql/users/updateMyPassword.graphql'
import UPDATE_USER_PWD from '@_/graphql/users/updateUserPassword.graphql'

export const PasswordUpdateButton = ({ _id, default_mode = "preview", query_type = "updateMyPassword" }) => {
    const [mode, setMode] = useState(default_mode || "preview");
    const [updateMyPassword, pwd_updates] = useMutation(UPDATE_PWD); // { data, loading, error }
    const [updateUserPassword, usr_pwd_updates] = useMutation(UPDATE_USER_PWD); // { data, loading, error }

    const onSubmit = async (values) => {
        if (!values.password || (values.password !== values.password_confirm)) {
            alert("Password missmatch")
            return false;
        }

        let input = {
            _id,
            password: values.password,
        }

        let resutls;

        if (query_type =='updateMyPassword') resutls = await updateMyPassword({ variables: { input } }).then(r => (r?.data?.updateMyPassword))
        else resutls = await updateUserPassword({ variables: { input } }).then(r => (r?.data?.updateUserPassword))

        if (!resutls || resutls.error) {
            message.error((resutls && resutls.error.message) || "Unable to update password")
            return false;
        }

        setMode("preview")
        return "reset"
    }

    if (!_id) return <Alert message="Update refference not available"  showIcon type="error" />

    return (<>
        <Button onClick={() => setMode("edit")} size="small" color="blue">Reset Password</Button>

        <Modal title={query_type =='updateMyPassword' ? 'Update My password' : "Update User Password"} open={mode == "edit"} footer={false} onCancel={() => setMode("preview")}>
            {mode == "edit" && <>
                <FinalForm onSubmit={onSubmit}
                    render={(formargs) => {
                        const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;
                        return (<>
                            <form id={"password_reset_form"} {...submitHandler(formargs)}><>
                                <Row gutter={[10, 20]}>
                                    <Col span={24}><FormField name="password" label="New Password" type="password" validate={rules.required} /></Col>
                                    <Col span={24}><FormField name="password_confirm" label="Confirm Password" type="password" validate={rules.required} /></Col>
                                </Row>

                                <div style={{ height: "20px" }} />
                                <Col align="right"><SubmitButton loading={submitting} disabled={invalid} color="orange" label={"Update Password"} /></Col>
                            </></form>

                        </>)

                    }}
                />
            </>}
        </Modal>
    </>)
}
PasswordUpdateButton.propTypes = {
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    default_mode: PropTypes.string,
    query_type: PropTypes.string,
}
