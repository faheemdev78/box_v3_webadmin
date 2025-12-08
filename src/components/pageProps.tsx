'use client';

import { createContext, useContext } from 'react';

const PageContext = createContext(null);

export function usePageProps() {
    return useContext(PageContext);
}

function PageProvider({ pageProps, children }: PageProvider_Props) {
    return (
        <PageContext.Provider value={pageProps}>
            {children}
        </PageContext.Provider>
    );
}

export default PageProvider

interface PageProvider_Props {
    children: React.ReactNode;
    pageProps: any;
    [key: string]: any; // for any additional product properties
}
