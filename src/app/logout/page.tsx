'use client'

import { Loader } from "@_/components";
import { sleep } from "@_/lib";
import { clearSessionToken } from "@_/lib/auth";
import { cleanStore } from "@_/rStore";
import { redirect } from "next/navigation";



export default async function Logout() {

    // clear cookies
    await clearSessionToken()
    // clear redux
    cleanStore();

    await sleep(100)
    redirect('/login')
    
    return <Loader loading={true} />;
}


