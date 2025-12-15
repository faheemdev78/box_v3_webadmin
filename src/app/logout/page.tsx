'use client'

import { Loader } from "@/components";
import { sleep } from "@/lib";
import { clearSessionToken } from "@/lib/auth";
import { cleanStore } from "@/rStore";
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
