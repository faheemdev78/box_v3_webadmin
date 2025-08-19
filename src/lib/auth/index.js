// export * from ''
import { isServer } from "@_/lib";
import client from "@_/aClient/client";
import { __yellow } from "../consoleHelper";
import { COOKIE_ID } from "@_/configs";
import { sleep } from "../utill";

import GET_CURRENT_USER from '@_/graphql/users/currentUser.graphql'

const cookieAge = 60 * 60 * 24; // 1 day

// Make this an async function
export async function getServerCookies() {
    // Server-side: Use Next.js headers (Must be passed down properly)
    const { cookies } = await require("next/headers");
    const cookieStore = await cookies(); // Get the cookie store
    return cookieStore.get(COOKIE_ID)?.value || "";
}

export function getClientCookies() {
    let t = document.cookie
        ?.split("; ")
        ?.find(row => row.startsWith(`${COOKIE_ID}=`))
        ?.replace(`${COOKIE_ID}=`, "") || ""

    return t;
}

export const getSessionToken = () => {
    // console.log(__yellow("getSessionToken()"))

    if (isServer) {
        return getServerCookies();

        // // Server-side: Use Next.js headers (Must be passed down properly)
        // const { cookies } = await require("next/headers");
        // const cookieStore = await cookies(); // Get the cookie store
        // return cookieStore.get(COOKIE_ID)?.value || "";
    } else {
        // Client-side: Use document.cookie
        return getClientCookies();

        // let t = document.cookie
        //     ?.split("; ")
        //     ?.find(row => row.startsWith(`${COOKIE_ID}=`))
        //     ?.replace(`${COOKIE_ID}=`, "") || ""

        // return t;

        // // return document.cookie
        // //     .split("; ")
        // //     .find(row => row.startsWith(`${COOKIE_ID}=`))
        // //     ?.split("=")[1] || "";
    }
};

// Make this async as well since it depends on cookies()
export const saveSessionToken = async (token) => {
    if (!token) {
        console.error("No token to save")
        return;
    }

    if (isServer) {
        // Server-side: Use Next.js cookies
        const { cookies } = await require("next/headers");
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_ID, token, {
            httpOnly: true,
            path: "/",
            maxAge: cookieAge,
            secure: process.env.NODE_ENV === 'development' ? false : true,
        });
    } else {
        // Client-side: Use document.cookie
        document.cookie = `${COOKIE_ID}=${token}; path=/; max-age=${cookieAge}; ${process.env.NODE_ENV !== 'development' ? "Secure" : ""}`;

    }
};

export const clearSessionToken = async () => {
    await fetch('/api/logout')

    if (isServer){
        // const { cookies } = await require("next/headers");
        // const cookieStore = await cookies();
        // cookieStore.clear()
        // const theme = cookieStore.get(COOKIE_ID)
    }
    else {
        document.cookie = `${COOKIE_ID}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }
    
    await sleep(100)

    return;
};

export async function getCurrentUser() {
    // if(process.env.NODE_ENV=='development') console.trace(__yellow("getCurrentUser()"))
    // console.log(__yellow("getCurrentUser()"))
    // console.trace()

    const { data, loading, error } = await client.query({ query: GET_CURRENT_USER })
    return data && data.currentUser;
}
