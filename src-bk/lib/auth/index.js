// export * from ''
import { isServer } from "@_/lib";
import client from "@_/aClient/client";
import GET_CURRENT_USER from '@_/graphql/user/currentUser.graphql'

const cookieAge = 60 * 60 * 24; // 1 day

// Make this an async function
export async function getServerCookies() {
    // Server-side: Use Next.js headers (Must be passed down properly)
    const { cookies } = await require("next/headers");
    const cookieStore = await cookies(); // Get the cookie store
    return cookieStore.get("sessionToken")?.value || "";
}

export function getClientCookies() {
    let t = document.cookie
        ?.split("; ")
        ?.find(row => row.startsWith("sessionToken="))
        ?.replace("sessionToken=", "") || ""

    return t;
}

export const getSessionToken = () => {
    if (isServer) {
        return getServerCookies();

        // // Server-side: Use Next.js headers (Must be passed down properly)
        // const { cookies } = await require("next/headers");
        // const cookieStore = await cookies(); // Get the cookie store
        // return cookieStore.get("sessionToken")?.value || "";
    } else {
        // Client-side: Use document.cookie
        return getClientCookies();

        // let t = document.cookie
        //     ?.split("; ")
        //     ?.find(row => row.startsWith("sessionToken="))
        //     ?.replace("sessionToken=", "") || ""

        // return t;

        // // return document.cookie
        // //     .split("; ")
        // //     .find(row => row.startsWith("sessionToken="))
        // //     ?.split("=")[1] || "";
    }
};

// Make this async as well since it depends on cookies()
export const createSessionToken = async (token) => {
    if (!token) {
        console.error("No token to save")
        return;
    }

    if (isServer) {
        // Server-side: Use Next.js cookies
        const { cookies } = require("next/headers");
        const cookieStore = await cookies();
        cookieStore.set("sessionToken", token, {
            httpOnly: true,
            path: "/",
            maxAge: cookieAge,
            secure: process.env.NODE_ENV === 'development' ? false : true,
        });
    } else {
        // Client-side: Use document.cookie
        document.cookie = `sessionToken=${token}; path=/; max-age=${cookieAge}; ${process.env.NODE_ENV !== 'development' ? "Secure" : ""}`;
    }
};

export const clearSessionToken = () => {
    document.cookie = "sessionToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
};

export async function getCurrentUser() {
    const { data, loading, error } = await client.query({ query: GET_CURRENT_USER })
    return data && data.currentUser;
}
