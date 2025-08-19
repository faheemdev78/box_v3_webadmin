// providers/SessionProvider.tsx
'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useCurrentUser } from '@_/lib/auth/hooks/useCurrentUser';

type SessionContextType = {
    user: any;
    loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
    user: null,
    loading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
    const { user, loading } = useCurrentUser();

    return (
        <SessionContext.Provider value={{ user, loading }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}

