'use client';

import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { __error } from "@/lib/consoleHelper";
// import { useRouter } from "next/navigation";
import { adminRoot } from "@/configs";
import { redirect, RedirectType } from 'next/navigation';


function ConsoleHome() {
    const session = useSelector((state:any) => state.session);
    // const router = useRouter()

    useEffect(() => {
        if (!session || !session.token) {
            console.log("Redirecting to /login")
            redirect('/login', RedirectType.replace);
            // router.replace('/login');
        } else {
            console.log("Redirecting to admin: ", adminRoot)
            redirect(adminRoot, RedirectType.replace);
            // router.replace(adminRoot);
        }
    }, [session]);

    return <p>Redirecting...</p>;
}

export default ConsoleHome;
