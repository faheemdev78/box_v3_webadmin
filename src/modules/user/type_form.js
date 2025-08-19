import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { Modal, Row, Col, Space, Alert } from 'antd';
import { Button } from '@_/components';
import { useLazyQuery, useMutation } from '@apollo/client';

import EDIT_ROLE from '@_/graphql/user_role/editUserRole.graphql'
import ADD_ROLE from '@_/graphql/user_role/addUserRole.graphql'
import { __error } from '@_/lib/consoleHelper';

export const TypeForm = ({ onSuccess, onCancel, show, fields }) => {
    const [error, setError] = useState(null);

    const [addUserRole, add_details] = useMutation(ADD_ROLE); // { data, loading, error }
    const [editUserRole, edit_details] = useMutation(EDIT_ROLE); // { data, loading, error }

    const onSubmit = async(values) => {
        setError(null);

        let input = {
            title: values.title,
            acc_type: values.acc_type,
        };

        var results;

        if (fields && fields._id) {
            Object.assign(input, { _id: fields._id })
            results = await editUserRole({ variables: {input} }).then((e) => (e?.data?.editUserRole))
            .catch(error => {
                console.log(__error("Error: "), error)
                return { error: { message:"Request Error"}}
            });
        } else {
            results = await addUserRole({ variables: { input } }).then((e) => (e?.data?.addUserRole))
                .catch(error => {
                    console.log(__error("Error: "), error)
                    return { error: { message: "Request Error" } }
                });
        }

        if (!results || results.error) {
            setError((results && results.error.message) || "Invalid response");
            return false;
        }

        onSuccess(results);
        return false;
    }

    return (<Modal open={show} destroyOnHidden footer={false} onCancel={onCancel}>

        <FinalForm onSubmit={onSubmit} initialValues={fields}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, dirty, errors, submitFailed } = formargs;

                return (<>
                    <form id="user_type_form" {...submitHandler(formargs)}>
                        {error && <Alert message={error} type='error' showIcon />}

                        <Row gutter={[10, 10]}>
                            <Col span={24}><FormField type="text" name="title" label="Title" validate={rules.required} /></Col>
                            <Col span={24}><FormField type="text" name="acc_type" label="Type Key (no space)" validate={[rules.required, rules.nospace, rules.minChar(4)]} /></Col>
                            <Col span={12}><Button onClick={onCancel} type="default">Cancel</Button></Col>
                            <Col span={12} align="right"><SubmitButton disabled={invalid || !dirty} color="orange" loading={submitting}>Save</SubmitButton></Col>
                        </Row>

                    </form>

                </>)

            }}
        />

    </Modal>)

}
TypeForm.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
    fields: PropTypes.object,
}
