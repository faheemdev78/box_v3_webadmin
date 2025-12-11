import { useEffect, useState } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { getSessionToken } from '..';
import { __yellow } from '../../consoleHelper';

import GET_CURRENT_USER from '@/graphql/users/currentUser.graphql'

export const useCurrentUser = () => {
    console.log(__yellow("useCurrentUser()"))
    // console.trace()

    const [token, setToken] = useState(null);

    const [loadGreeting, { called, loading, data }] = useLazyQuery(GET_CURRENT_USER, { fetchPolicy: "network-only" });

    useEffect(() => { // This only runs on client-side
        if (token !== null || called) return;
        loadGreeting();
        setToken(getSessionToken());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (token === null) return {};

    return {
        ...data,
        user: data && data?.currentUser,
        isAuthenticated: !!data?.currentUser,
        token,
        // loading, error,
    };
};
