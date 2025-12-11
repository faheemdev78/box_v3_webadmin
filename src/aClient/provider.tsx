'use client'

// import { useMemo } from "react";
// import { ApolloProvider } from "@apollo/client";
import { ApolloProvider } from '@apollo/client/react'
import createApolloClient from "./client";

// const initializeApollo = (initialState = null) => {
//     const apolloClient = createApolloClient();
//     if (initialState) apolloClient.cache.restore(initialState);
//     return apolloClient;
// };

// export const ApolloWrapper = ({ children, pageProps }) => {
//     const client = useMemo(() => initializeApollo(pageProps.initialApolloState), [pageProps.initialApolloState]);

//     return <ApolloProvider client={client}>{children}</ApolloProvider>;
// };


const client = createApolloClient; //();

function ApolloWrapper({ children }: { children: React.ReactNode }) {
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default ApolloWrapper;
