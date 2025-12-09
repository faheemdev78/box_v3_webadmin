// Edge Runtime compatible auth helpers
import { COOKIE_ID } from "@_/configs";

// Edge Runtime compatible - uses Request cookies API
export async function getServerCookies() {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_ID)?.value || "";
}

export const getSessionToken = () => {
    // In Edge Runtime/middleware, this will always be server-side
    return getServerCookies();
};
