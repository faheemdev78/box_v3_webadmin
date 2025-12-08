'use client'

import { Loader } from "@_/components";
import { sleep } from "@_/lib";
import { clearSessionToken } from "@_/lib/auth";
import { cleanStore } from "@_/rStore";
import { redirect } from "next/navigation";



function Logout() {

    // clear cookies
    clearSessionToken()
    // clear redux
    cleanStore();

    sleep(100)
    redirect('/login')

    return <Loader loading={true} />;
}

export default Logout
