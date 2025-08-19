'use client';

import { createContext, useContext } from 'react';

const PageContext = createContext(null);

export function usePageProps() {
    return useContext(PageContext);
}

export default function PageProvider({ pageProps, children }: PageProvider_Props) {
    return (
        <PageContext.Provider value={pageProps}>
            {children}
        </PageContext.Provider>
    );
}


interface PageProvider_Props {
    children: React.ReactNode;
    pageProps: any;
    [key: string]: any; // for any additional product properties
}
