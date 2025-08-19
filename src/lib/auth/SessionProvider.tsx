// providers/SessionProvider.tsx
'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useCurrentUser } from '@_/lib/auth/hooks/useCurrentUser';
import { getSessionToken } from '@_/lib/auth';

type SessionContextType = {
    user: any;
    loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
    user: null,
    loading: true,
});

export async function SessionProvider({ children }: { children: ReactNode }) {
    let token = await getSessionToken();

    return (<>
        <h1>SessionProvider</h1>
        {children}
    </>)

    // const { user, loading } = useCurrentUser();

    // return (
    //     <SessionContext.Provider value={{ user, loading }}>
    //         {children}
    //     </SessionContext.Provider>
    // );
}

export function useSession() {
    return useContext(SessionContext);
}

