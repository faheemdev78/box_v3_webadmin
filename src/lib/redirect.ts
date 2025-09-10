"use client";

import { redirect as serverRedirect } from "next/navigation";

export function handleRedirectLogin() {
    if (typeof window !== "undefined") {
        // Client-side navigation
        window.location.href = "/login";
    } else {
        // Server-side (SSR)
        serverRedirect("/login");
    }
}
