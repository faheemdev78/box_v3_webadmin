'use client'

import React, { useEffect, useState } from 'react'
import { clearSessionToken, getSessionToken } from "@_/lib/auth";
import Link from 'next/link';
import { sleep } from '@_/lib';
import { cleanStore } from '@_/rStore';

export function LoginButton() {
    const [token, setToken] = useState(null);

    useEffect(() => {
        // This only runs on client-side
        setToken(getSessionToken());
    }, []);


    async function logout() {
        clearSessionToken();
        cleanStore();
        await sleep(100)
        window.location = '/'
    }

    if (token === null) { // Return null or a loading state during SSR/hydration
        return null;
    }

    return token ? (
        <button onClick={logout}>Logout</button>
    ) : (
        <Link href={'/login'}>Login</Link>
    ); 

}

export default LoginButton;