import { NextResponse } from 'next/server';
import { getSessionToken } from '@_/lib/auth';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // const token = request.cookies.get('token')?.value;
    let token = request.cookies.get('sessionToken')?.value;
    if (!token) token = await getSessionToken();
    

    // redirect user to login on protected paths
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // retirect user to dash if already loged in and on login page
    if (authRoutes.includes(pathname) && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}