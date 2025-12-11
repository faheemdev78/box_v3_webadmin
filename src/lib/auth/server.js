import { cookies } from "next/headers";
import { COOKIE_ID } from "@/configs";

const cookieAge = 60 * 60 * 24; // 1 day

export function getServerSessionToken() {
    const cookieStore = cookies();
    return cookieStore.get(COOKIE_ID)?.value || "";
}

export function setServerSessionToken(token) {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_ID, token, {
        httpOnly: true,
        path: "/",
        maxAge: cookieAge,
        secure: process.env.NODE_ENV === 'development' ? false : true,
    });
}

export function deleteServerSessionToken() {
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_ID);
}
