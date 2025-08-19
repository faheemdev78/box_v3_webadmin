'use client'
import React, { useEffect, useState } from 'react'

import { cleanStore } from '@_/rStore';
import { getSessionToken, clearSessionToken } from '@_/lib/auth';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from "@_/lib/auth";
import { setSession, clearSession } from '@_/rStore/slices/sessionSlice';



export default function ValidateClientSession({ children }) {
  // console.log("------------ ValidateClientSession()")

    const [validating, setValidating] = useState(false)
    const session = useSelector((state) => state.session);
    const token = getSessionToken();
    const dispatch = useDispatch();

    
    useEffect(() => {
      if(!token){
        if (session && session.token) cleanStore();
        return;
      }

      if(token && (!session || session.token !== token)) {
        console.log("Refreshing user session");
        setValidating(true)
        refreshUserSession()
      }
      
    }, [token, session]);
    

    async function refreshUserSession(){
      let user = await getCurrentUser().catch(err=>{
        console.error(err)
        return { error:{message:"Request Error!"} }
      })
      
      if (!user || user.error) {
        alert("Failed to refresh user session");
        cleanStore();
        clearSessionToken()
        setValidating(false)
        return;
      }

      dispatch(setSession({ user, token }));
      setValidating(false)
    }


    if (validating) return <p>Validating user session...</p>

    return children;
}

// export const updateUserSession = async (user) => {
//   let user = await getCurrentUser().catch(err => {
//     console.error(err)
//     return { error: { message: "Request Error!" } }
//   })

//   if (!user || user.error) {
//     alert("Failed to refresh user session");
//     cleanStore();
//     clearSessionToken()
//     setValidating(false)
//     return;
//   }

//   dispatch(setSession({ user, token }));
//   setValidating(false)
// }
// }
