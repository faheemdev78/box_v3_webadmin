'use client';

import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { __error } from "@_/lib/consoleHelper";
import { useRouter } from "next/navigation";
import { adminRoot } from "@_/configs";
import { redirect, RedirectType } from 'next/navigation';


function ConsoleHome(props) {
    const session = useSelector((state) => state.session);
    const router = useRouter()

    useEffect(() => {
        if (!session || !session.token) {
            redirect('/login', RedirectType.replace);
            // router.replace('/login');
        } else {
            redirect(adminRoot, RedirectType.replace);
            // router.replace(adminRoot);
        }
    }, [session]);

    return <p>Redirecting...</p>;
}

export default ConsoleHome;
