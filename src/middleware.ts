import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";
import { getSessionToken } from '@/lib/auth';
import { __error } from '@/lib/consoleHelper';

const protectedRoutes = ['/console'];
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // const token = request.cookies.get('token')?.value;
    // let token = request.cookies.get(COOKIE_ID)?.value;
    // if (!token) token = await getSessionToken();
    
    type StoreJwtPayload = JwtPayload & { _id_store?: string };

    let token = await getSessionToken()
    let decoded: StoreJwtPayload | undefined;
    if (token){
        try {
            decoded = jwtDecode<JwtPayload>(token)
            // console.log('User from JWT:', decoded);

            // You can set a header to forward to SSR server components:
            // const response = NextResponse.next();
            // response.headers.set('x-user-id', decoded.userId);
            // response.headers.set('x-user-email', decoded.email);
            // return response;
        } catch (e) {
            console.error('Invalid token', { token });
            // console.log(__error("Invalid token"), e);
            // console.log({ token })
        }
    }

    // Restrict store user access
    if (decoded && decoded._id_store && pathname.startsWith("/console")){
        let requriedStorePath = `/console/store/${decoded._id_store}`;

        if (pathname !== requriedStorePath && !pathname.startsWith(`/console/store/${decoded._id_store}/`)){
            console.log(__error("Invalid store access"))
            return NextResponse.redirect(new URL(`/console/store/${decoded._id_store}`, request.url));
        }
    }

    // let user;
    // if (token) user = await getCurrentUser()
    // console.log("user: ", user)

    // if(process.env.NODE_ENV == 'development') console.log("middleware > token: ", token)
    

    // redirect user to login on protected paths
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // retirect user to dash if already loged in and on login page
    if (authRoutes.includes(pathname) && token) {
        return NextResponse.redirect(new URL('/console', request.url));
    }

    return NextResponse.next();
}
