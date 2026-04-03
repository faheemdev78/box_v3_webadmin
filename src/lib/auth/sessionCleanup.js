"use client";

import { COOKIE_ID } from "@/configs";
import { handleRedirectLogin } from "@/lib/redirect";
import { persistor, store } from "@/rStore";
import { clearSession } from "@/rStore/slices/sessionSlice";
import { resetTillVerification } from "@/rStore/slices/tillVerificationSlice";

let logoutInProgress = false;

export function isUnauthenticatedGraphQLError(error) {
    if (!error?.errors?.length) return false;

    return error.errors.some(({ message, extensions }) => {
        const normalizedMessage = String(message || "").toLowerCase();
        const errorCode = String(extensions?.code || "").toUpperCase();

        return normalizedMessage.includes("not authenticated") || errorCode === "UNAUTHENTICATED";
    });
}

export async function logoutUnauthenticatedUser() {
    if (typeof window === "undefined" || logoutInProgress) return;

    logoutInProgress = true;

    try {
        store.dispatch(clearSession());
        store.dispatch(resetTillVerification());
        await persistor.flush();

        await fetch("/api/logout").catch(() => null);
        document.cookie = `${COOKIE_ID}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    } finally {
        handleRedirectLogin();
    }
}
