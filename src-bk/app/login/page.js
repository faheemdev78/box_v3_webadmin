'use server'

import { getSessionToken } from "@_/lib/auth";
import { LoginForm } from "@_/components";


export default async function Login() {
    let token = await getSessionToken()
    // console.log("existingtoken: ", existingtoken)
    // console.log(document.cookie);
    
    // useEffect(() => {
    //     if (!document) return;
    //     console.log(document.cookie.includes("sessionToken"));
    // }, [document]);    

    if (token) return <p>You are already logged in</p>

    return (<LoginForm />)

}


