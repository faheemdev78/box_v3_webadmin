'use client';

import { useEffect } from "react";
import { useSelector } from 'react-redux';
import { __error } from "@/lib/consoleHelper";
import { adminRoot } from "@/configs";
import { redirect, RedirectType } from 'next/navigation';

function ConsoleHomeClient() {
    const session = useSelector((state:any) => state.session);

    useEffect(() => {
        if (!session || !session.token) {
            console.log("Redirecting to /login")
            redirect('/login', RedirectType.replace);
        } else {
            console.log("Redirecting to admin: ", adminRoot)
            redirect(adminRoot, RedirectType.replace);
        }
    }, [session]);

    return <p>Redirecting...</p>;
}

export default ConsoleHomeClient;
