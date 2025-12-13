'use server'

import { getServerSessionToken } from "@_/lib/auth/server";
import LoginForm from "@/modules/login/LoginForm";
import { redirect } from "next/navigation";


export default async function Login() {
    let token = await getServerSessionToken()

    if (token){
        redirect('/logout')
        return null;
    }

    // useEffect(() => {
    //     if (!document) return;
    //     console.log(document.cookie.includes("sessionToken"));
    // }, [document]);    

    // if (token) return <p>You are already logged in</p>

    return (<div className="flex justify-center items-center h-screen">
        <LoginForm />
    </div>)

}

