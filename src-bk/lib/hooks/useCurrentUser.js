'use client'

// hooks/useCurrentUser.js
import { useEffect, useState } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { createSessionToken, clearSessionToken, getSessionToken } from "@_/lib/auth";

import GET_CURRENT_USER from '@_/graphql/user/currentUser.graphql'

export const useCurrentUser = () => {
    // const [called, setCalled] = useState(false)
    const [token, setToken] = useState(null);
    // const { data, called, ...others } = useLazyQuery(GET_CURRENT_USER, { fetchPolicy: 'cache-and-network' });
    const [loadGreeting, { called, loading, data }] = useLazyQuery(
        GET_CURRENT_USER,
        { fetchPolicy: "network-only" }
    );


    useEffect(() => { // This only runs on client-side
        if (!(token===null)) return;
        if (!called) loadGreeting();
        setToken(getSessionToken());
    }, []);

    // useEffect(() => {
    //     if (called) return;
    //     setCalled(true)
    //     getSessionToken().then(r => setToken(r))
    // }, [])

    if (token === null) return {};

    // const { data, ...others } = useQuery(GET_CURRENT_USER, {
    //     fetchPolicy: 'cache-and-network',
    // });

    return {
        ...data,
        user: data && data?.currentUser,
        isAuthenticated: !!data?.currentUser,
        token,
        // loading, error,
    };
};
