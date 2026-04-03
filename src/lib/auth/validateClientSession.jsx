'use client'
import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux';
import { setSession, clearSession, getSession } from '@/rStore/slices/sessionSlice';
import { getActiveShift, resetTillVerification } from '@/rStore/slices/tillVerificationSlice';
import { Loader } from '@/components';
import { useAppSelector } from '@/rStore/hooks';
import { getCurrentUser, getSessionToken, clearSessionToken } from '.';
import { isUnauthenticatedGraphQLError, logoutUnauthenticatedUser } from './sessionCleanup';
// import { sleep } from '..';

function ValidateClientSession({ children }) {
  const [ready, setReady] = useState(false);
  
  const token = getSessionToken();
  const session = useAppSelector(getSession)
  const activeShift = useAppSelector(getActiveShift)
  // const session = useSelector((state) => state.session);

  const dispatch = useDispatch();

  useEffect(() => {
    if(ready) return;

    // clear store session if no cookies token exists
    if (!token && session && session.token) {
      dispatch(clearSession());
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
      getCurrentUser()
        .then(user => {
          if (user && !user.error) {
            dispatch(setSession({ user, token }));

            if (activeShift?._id_staff && activeShift._id_staff !== user._id) {
              dispatch(resetTillVerification());
            }
          }

          setReady(true)
        })
        .catch(async (error) => {
          const message = String(error?.message || "").toLowerCase();

          if (message.includes('not authenticated') || isUnauthenticatedGraphQLError(error)) {
            await logoutUnauthenticatedUser();
            return;
          }

          console.error('ValidateClientSession failed:', error);
          setReady(true);
        })
      return;
    }


    setReady(true);
  }, [activeShift, dispatch, ready, session, token])
  
  if (!ready) return <Loader loading={true}>Validating Session....</Loader>


  return (<>
    {children}
  </>)
}
export default ValidateClientSession

function ValidateClientSession_BK2({ children }) {
  const session = useSelector((state) => state.session);
  const token = getSessionToken();
  const dispatch = useDispatch();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    if (!token){
      if (session && session.token) { // clear store if no session not found!
        dispatch(clearSession());
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
        if (session && session.token) dispatch(clearSession());
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
        dispatch(clearSession());
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
