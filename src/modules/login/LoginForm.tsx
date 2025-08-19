'use client'

import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { Alert, Col, Row, Space, message } from 'antd';
// import Image from 'next/image';
import { Image } from '@_/components'
import { useMutation, useLazyQuery } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { adminRoot } from '@_/configs';
import { saveSessionToken, clearSessionToken, getSessionToken } from "@_/lib/auth";
import { sleep } from '@_/lib';
import { setSettings, getSettings, getSystemState, getFmcToken } from '@_/rStore/slices/systemSlice';
import { setSession } from '@_/rStore/slices/sessionSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@_/rStore/hooks';
import { redirect, RedirectType } from 'next/navigation'
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

import LOGIN_MUTATION from '@_/graphql/users/login.graphql'

const APP_VER = process.env.APP_VER;

const LoginForm = () => {
    const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION);

    // const [error, setError] = useState(false)
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('callbackUrl') || adminRoot;

    // const { settings, fmc_token } = useAppSelector(getSystemState);
    const dispatch = useAppDispatch();
    const fmc_token = useAppSelector(getFmcToken);

    const onSubmit = async ({ username, pwd }: {
        username: string;
        pwd: string;
    }) => {
        messageApi.open({ key: "updatable", type: 'loading', content: 'Processing...' });

        let input = { 
            username, 
            pwd,
            fmc_token: fmc_token,
            app: APP_VER
        }

        const response = await loginMutation({ variables: input })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.login }))
            .catch(error =>{
                console.error(error)
                // console.log(Object.keys(error))
                // console.log("error.name: ", error.name)
                // console.log("error.graphQLErrors: ", error.graphQLErrors)
                // console.log("error.protocolErrors: ", error.protocolErrors)
                // console.log("error.clientErrors: ", error.clientErrors)
                // console.log("error.networkError: ", error.networkError)
                // console.log("error.message: ", error.message)
                // console.log("error.extraInfo: ", error.extraInfo)
                // console.log("error.cause: ", error.cause)
                return { error:{message:"Request Error!"}}
            });

        if (!response || response.error){
            // console.error(response)
            messageApi.open({ key: "updatable", type: 'error', duration: 2, content: (response && response?.error?.message) || "Invalid Response!" });
            return false;
        }

        if (response.token) {
            try {
                saveSessionToken(response.token);
            } catch (error) {
                console.error(error)
                message.error("Failed to create session");
                return false;
            }

            messageApi.open({ key: "updatable", type: 'success', duration: 2, content: 'Logged In successfully' });
            dispatch(setSession({
                token: response.token,
                user: response.user,
            }));
            await sleep(500)
            // document.cookie = `sessionToken=${response.token}; path=/; Secure; HttpOnly`;
            // window.location.reload(); // Refresh to apply session
            // window.location = redirectTo || '/';
            // router()
            redirect((redirectTo || '/'), RedirectType.replace)
        }

        return false;
    };
    


    return (<div style={{ width: "500px", backgroundColor: "white", borderColor: "#DDD" }} className='bordered rounded-10 p-20 shadow-xl'>
        {contextHolder} {/* place holder for message + loader */}

        <Space>
            <Image src="/android-chrome-512x512.png" width={200} height={200} alt="" />

            <FinalForm onSubmit={onSubmit}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    return (<>
                        {(router?.query?.error) && <Alert message={router?.query?.error} showIcon type='error' />}

                        <form id="login_form" {...submitHandler(formargs)}><Row gutter={[10, 10]}>
                            <Col span={24}><FormField name="username" label="Email / Login ID" type="text" validate={rules.required} /></Col>
                            <Col span={24}><FormField name="pwd" label="Password" type="password" validate={rules.required} /></Col>
                            <Col span={24} align="center"><SubmitButton loading={submitting} disabled={invalid} color="orange" label="Log-In" /></Col>
                        </Row></form>
                    </>)

                }}
            />
        </Space>


    </div>)
}

// export async function getServerSideProps(context) {
//     const csrfToken = await getCsrfToken(context)
//     return {
//         props: { csrfToken },
//     }
// }
export default LoginForm;