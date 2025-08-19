'use client'
import React, { useEffect, useState } from 'react'

import { cleanStore } from '@_/rStore';
import { useDispatch, useSelector } from 'react-redux';
import { setSession, clearSession, getSession } from '@_/rStore/slices/sessionSlice';
import { Loader } from '@_/components';
import { useAppSelector } from '@_/rStore/hooks';
import { getCurrentUser, getSessionToken, clearSessionToken } from '.';
import { sleep } from '..';

export default function ValidateClientSession({ children }) {
  const [ready, setReady] = useState(false);
  
  const token = getSessionToken();
  const session = useAppSelector(getSession)
  // const session = useSelector((state) => state.session);

  const dispatch = useDispatch();

  useEffect(() => {
    if(ready) return;

    // clear store session if no cookies token exists
    if (!token && session && session.token) {
      cleanStore();
      clearSessionToken().then(r=>{
        setReady(true);
      })
      return;
    }

    
    // // populate store session if token found but session is empty
    // if (token && !session){
    //   getCurrentUser().then(user => {
    //     if (user && !user.error) dispatch(setSession({ user, token }));
    //     setReady(true)
    //   })
    // }
    

    // Refresh store session if token is found
    if (token) {
      getCurrentUser().then(user => {
        if (user && !user.error) dispatch(setSession({ user, token }));
        setReady(true)
      })
      return;
    }


    setReady(true);
  }, [ready, token, session])
  
  if (!ready) return <Loader loading={true}>Validating Session....</Loader>


  return (<>
    {children}
  </>)
}

function ValidateClientSession_BK2({ children }) {
  const session = useSelector((state) => state.session);
  const token = getSessionToken();
  const dispatch = useDispatch();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    if (!token){
      if (session && session.token) { // clear store if no session not found!
        cleanStore();
      }
      setReady(true)
    }
    else {
      getCurrentUser().then(user => {
        if (user && !user.error) dispatch(setSession({ user, token }));
        setReady(true)
      })
    }

  }, []);

  if (!ready) return <Loader loading={true}>Validating Session....</Loader>

  return <p>ValidateClientSession</p>

  return children;
}


function ValidateClientSession_BK({ children, user }) {
  // console.log("------------ ValidateClientSession()")

  // const [refreshed, setValidating] = useState(false)
  const [validating, setValidating] = useState(false)
  const session = useSelector((state) => state.session);
  const token = getSessionToken();
  const dispatch = useDispatch();

  // useEffect(() => {
  //   if (!token) return;

  //   dispatch(setSession({ user, token }));
  // }, [user, token])
  


    useEffect(() => {
      if (validating) return;

      if(!token){
        if (session && session.token) cleanStore();
        return;
      }

      // setValidating(true)
      // refreshUserSession()

      // if(token && (!session || session.token !== token)) {
      //   console.log("Refreshing user session");
      //   setValidating(true)
      //   refreshUserSession()
      // }
      
    }, [token, session]);
    

    async function refreshUserSession(){
      let user = await getCurrentUser().catch(err=>{
        console.error(err)
        return { error:{message:"Request Error!"} }
      })

      console.log("user: ", user)

      if (!user){
        alert("Failed to refresh user session");
        return false;
      }
      
      if (user && user.error) {
        alert("User Session is invalid!");
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
