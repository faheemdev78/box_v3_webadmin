import client from "@_/aClient/client";
import { COOKIE_ID } from "@_/configs";
import { sleep } from "../utill";

import GET_CURRENT_USER from '@_/graphql/users/currentUser.graphql'

const cookieAge = 60 * 60 * 24; // 1 day

export function getClientCookies() {
    let t = document.cookie
        ?.split("; ")
        ?.find(row => row.startsWith(`${COOKIE_ID}=`))
        ?.replace(`${COOKIE_ID}=`, "") || ""

    return t;
}

export const getSessionToken = () => {
    if (typeof window === "undefined") {
        return "";
    }

    return getClientCookies();
};

export const saveSessionToken = async (token) => {
    if (!token) {
        console.error("No token to save");
        return;
    }

    if (typeof window === "undefined") {
        console.error("saveSessionToken() called on server");
        return;
    }

    document.cookie = `${COOKIE_ID}=${token}; path=/; max-age=${cookieAge}; ${process.env.NODE_ENV !== 'development' ? "Secure" : ""}`;
};

export const clearSessionToken = async () => {
    if (typeof window !== "undefined") {
        await fetch('/api/logout');
        document.cookie = `${COOKIE_ID}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }
    
    await sleep(100);
    return;
};

// export async function getCurrentUser(authToken?: string) {
export async function getCurrentUser(authToken) {
    const { data, loading, error } = await client.query({
        query: GET_CURRENT_USER,
        context: authToken ? { authToken } : undefined,
    });
    return data && data.currentUser;
}
