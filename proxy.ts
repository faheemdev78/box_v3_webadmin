import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";
import { getSessionToken } from '@/lib/auth/index.edge';

const protectedRoutes = ['/console'];
const authRoutes = ['/login'];

export const config = {
    unstable_allowDynamic: [
        // allows a single file
        // '/lib/utilities.js',
        // use a glob to allow anything in the function-bind 3rd party module
        // '**/node_modules/function-bind/**',
        '**/node_modules/ansi-colors/**'
    ],
}

export default async function proxy(request: NextRequest) {

    const { pathname } = request.nextUrl;
    type StoreJwtPayload = JwtPayload & { _id_store?: string };

    let token = await getSessionToken()
    let decoded: StoreJwtPayload | undefined;
    if (token) {
        try {
            decoded = jwtDecode<JwtPayload>(token)
            // You can set a header to forward to SSR server components:
            // const response = NextResponse.next();
            // response.headers.set('x-user-id', decoded.userId);
            // response.headers.set('x-user-email', decoded.email);
            // return response;
        } catch (e) {
            console.error('Invalid token', { token });
        }
    }

    // Restrict store user access
    if (decoded && decoded._id_store && pathname.startsWith("/console")) {
        let requriedStorePath = `/console/store/${decoded._id_store}`;

        if (pathname !== requriedStorePath && !pathname.startsWith(`/console/store/${decoded._id_store}/`)) {
            console.error("Invalid store access")
            return NextResponse.redirect(new URL(`/console/store/${decoded._id_store}`, request.url));
        }
    }

    // redirect user to login on protected paths
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // retirect user to dash if already loged in and on login page
    if (authRoutes.includes(pathname) && token) {
        return NextResponse.redirect(new URL('/console', request.url));
    }

    // no-op proxy handler to satisfy Next's requirement without custom behavior
    return NextResponse.next();
}
