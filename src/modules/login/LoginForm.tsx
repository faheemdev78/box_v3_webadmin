'use client'
import { Alert, Col, Row, Space, message } from 'antd';
import { Image } from '@/components'
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import { adminRoot } from '@/configs';
import { saveSessionToken, clearSessionToken, getSessionToken } from "@/lib/auth";
import { sleep } from '@/lib';
import { getFmcToken } from '@/rStore/slices/systemSlice';
import { setSession } from '@/rStore/slices/sessionSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/rStore/hooks';
import { redirect, RedirectType } from 'next/navigation'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import LOGIN_MUTATION from '@/graphql/users/login.graphql'

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
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.login }))
            .catch(catchApolloError)

        if (response.error){
            messageApi.open({ key: "updatable", type: 'error', duration: 2, content: response?.error?.message || "Invalid Response!" });
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
                        <form id="login_form" {...submitHandler(formargs)}><Row gutter={[10, 10]}>
                            <Col span={24}><FormField name="username" label="Email / Login ID" type="text" validate={rules.required} /></Col>
                            <Col span={24}><FormField name="pwd" label="Password" type="password" validate={rules.required} /></Col>
                            <Col span={24} style={{ textAlign: "center" }}><SubmitButton loading={submitting} disabled={invalid} color="orange" label="Log-In" /></Col>
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