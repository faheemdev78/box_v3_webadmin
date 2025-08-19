'use client'

import React from 'react'
import { useEffect, useState } from "react";
import { useMutation, useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { saveSessionToken, clearSessionToken, getSessionToken } from "@_/lib/auth";
import { sleep } from "@_/lib";
import { useDispatch, useSelector } from 'react-redux';
import { setSession, clearSession } from '@_/rStore/slices/sessionSlice';
import { message } from 'antd';

import LOGIN_MUTATION from '@_/graphql/user/login.graphql'

export function LoginForm() {
    const [errorString, setErrorString] = useState(null);
    const [values, setValues] = useState({ email:"bluevision@gmail.com", password:"F@h33m78" });
    const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION);
    // const router = useRouter()
    // const session = useSelector((state) => state.session);
    const dispatch = useDispatch();

    // let existingtoken = getSessionToken()
    // console.log("existingtoken: ", existingtoken)
    // console.log(document.cookie);
    
    // useEffect(() => {
    //     if (!document) return;
    //     console.log(document.cookie.includes("sessionToken"));
    // }, [document]);    


    const handleLogin = async (e) => {
        e.preventDefault();

        let input = {
            email: values.email, 
            password: values.password
        }

        const response = await loginMutation({ variables: input }).then(r => r?.data?.login)
            .catch(err=>{
                console.error(err)
                return { error:{message:"Request Error!"}}
            });

        if (!response || response.error){
            setErrorString((response && response.error.message) || "Invalid Response!")
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
            dispatch(setSession({
                token: response.token,
                user: response.user,
            }));
            await sleep(500)
            // document.cookie = `sessionToken=${response.token}; path=/; Secure; HttpOnly`;
            // window.location.reload(); // Refresh to apply session
            window.location = '/'
            // router()
        }

        return;


        // try {
        //     const { data } = await loginMutation({ variables: { email, password } });
        //     login(data.login.token);
        // } catch (err) {
        //     console.error("Login failed:", err);
        // }
    };

    return (
        <div>
            <h2>Login</h2>
            {(error || errorString) && <p style={{ color: "red" }}>{errorString || "Login failed"}</p>}

            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={values.email} onChange={(e) => setValues({ email: e.target.value })} required />
                <input type="password" placeholder="Password" value={values.password} onChange={(e) => setValues({ password: e.target.value })} required />
                <button type="submit" disabled={loading}>Login</button>
            </form>
        </div>
    );
}

export default LoginForm;