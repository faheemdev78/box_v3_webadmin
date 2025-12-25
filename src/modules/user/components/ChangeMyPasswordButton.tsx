'use client'

import React, { useState } from 'react'
import { Form as FinalForm } from 'react-final-form';
import { FormField, SubmitButton, rules } from '@/components/form';
import { useMutation } from '@apollo/client/react';
import { Col, Modal, Row, message } from 'antd';
import { Button } from '@/components';
import { SafetyOutlined } from '@ant-design/icons';

import UPDATE_MY_PASSWORD from '@/graphql/users/updateMyPassword.graphql'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

type ChangeMyPasswordButtonProps = {
    buttonText?: string;
    buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
    buttonBlock?: boolean;
    buttonIcon?: React.ReactNode;
};

export const ChangeMyPasswordButton: React.FC<ChangeMyPasswordButtonProps> = ({
    buttonText = "Change Password",
    buttonType = "default",
    buttonBlock = false,
    buttonIcon = <SafetyOutlined />
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updateMyPassword] = useMutation(UPDATE_MY_PASSWORD);

    const onSubmit = async (values: any) => {
        // Validate new password matches confirmation
        if (!values.newPassword || (values.newPassword !== values.confirmPassword)) {
            message.error("New password and confirmation do not match");
            return false;
        }

        // Validate old password is provided
        if (!values.oldPassword) {
            message.error("Current password is required");
            return false;
        }

        // Validate new password is different from old password
        if (values.oldPassword === values.newPassword) {
            message.error("New password must be different from current password");
            return false;
        }

        const input = {
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
        };

        try {
            const result = await updateMyPassword({
                variables: { input }
            })
                .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.updateMyPassword }))
                .catch(catchApolloError)
            // const result = (data as Record<string, unknown>)?.updateMyPassword as { error?: { message?: string } } | undefined;

            if (!result || result.error) {
                message.error(result?.error?.message || "Unable to update password");
                return false;
            }

            message.success("Password updated successfully");
            setIsModalOpen(false);
            return "reset";
        } catch (error: any) {
            message.error(error?.message || "An error occurred while updating password");
            return false;
        }
    }

    const validatePasswordStrength = (value: string) => {
        if (!value) return undefined;

        if (value.length < 8) {
            return "Password must be at least 8 characters long";
        }

        // Optional: Add more strength requirements
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            // return "Password must contain uppercase, lowercase, and numbers";
        }

        return undefined;
    };

    const validateConfirmPassword = (value: string, allValues: any) => {
        if (value !== allValues.newPassword) {
            return "Passwords do not match";
        }
        return undefined;
    };

    return (<>
        <Button
            onClick={() => setIsModalOpen(true)}
            type={buttonType}
            block={buttonBlock}
            icon={buttonIcon}
        >
            {buttonText}
        </Button>

        <Modal
            title="Change Password"
            open={isModalOpen}
            footer={null}
            onCancel={() => setIsModalOpen(false)}
            width={500}
        >
            <FinalForm
                onSubmit={onSubmit}
                render={(formargs) => {
                    const { handleSubmit, submitting, invalid } = formargs;

                    return (
                        <form id="change_password_form" onSubmit={handleSubmit}>
                            <Row gutter={[10, 20]}>
                                <Col span={24}>
                                    <FormField
                                        name="oldPassword"
                                        label="Current Password"
                                        type="password"
                                        validate={rules.required}
                                        placeholder="Enter your current password"
                                    />
                                </Col>

                                <Col span={24}>
                                    <FormField
                                        name="newPassword"
                                        label="New Password"
                                        type="password"
                                        // validate={(value) => rules.required(value) || validatePasswordStrength(value)}
                                        validate={rules.required}
                                        placeholder="Enter new password (min 8 characters)"
                                    />
                                </Col>

                                <Col span={24}>
                                    <FormField
                                        name="confirmPassword"
                                        label="Confirm New Password"
                                        type="password"
                                        validate={validateConfirmPassword}
                                        placeholder="Re-enter new password"
                                    />
                                </Col>
                            </Row>

                            <div style={{ marginTop: 24, textAlign: 'right' }}>
                                <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
                                <SubmitButton
                                    loading={submitting}
                                    disabled={invalid || submitting}
                                    color="primary"
                                    label="Update Password"
                                />
                            </div>
                        </form>
                    );
                }}
            />
        </Modal>
    </>)
}
