'use client'

import { useEffect } from "react";
import { Loader } from "@/components";
import { clearSessionToken } from "@/lib/auth";
import { store } from "@/rStore";
import { clearSession } from "@/rStore/slices/sessionSlice";
import { useRouter } from "next/navigation";



function Logout() {
    const router = useRouter();

    useEffect(() => {
        async function runLogout() {
            store.dispatch(clearSession());
            await clearSessionToken();
            router.replace('/login');
        }

        runLogout();
    }, [router]);

    return <Loader loading={true} />;
}

export default Logout
