import { isServer } from "@_/lib";
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { clearSessionToken, getSessionToken } from "@_/lib/auth";
import { handleRedirectLogin } from "@_/lib/redirect";
import { app_ver } from "@_/configs";


// Error link
const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        for (let err of graphQLErrors) {
            if (err.extensions?.code === "UNAUTHENTICATED") {
                console.warn("Session expired or invalid token");

                // Clear token (cookie/localStorage)
                // document.cookie = "your_token_cookie=; Max-Age=0; path=/";
                clearSessionToken().then(r=>{
                    // Redirect to login
                    handleRedirectLogin
                });
            }
        }
    }

    if (networkError) {
        console.error("Network error:", networkError);
    }
});

const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URI,
    credentials: "include",
});

const authLink = setContext(async (_, { headers }) => {
    // console.log("headers: ", headers)

    // On server-side, you might need to pass cookies from the request
    // if (isServer && typeof window === "undefined") {
    //     const { headers: nextHeaders } = require("next/headers");
    //     const _headers = await nextHeaders()
    //     console.log("_headers: ", _headers)
    //     const cookie = await _headers.get("cookie") || "";
    //     console.log("cookie: ", cookie)

    //     return { headers: { ...headers, cookie } };
    // }

    const token = await getSessionToken(); // Await here
    return {
        headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : "",
            'x-app-ver': app_ver,
        },
    };
});


// Create a cache with type policies
// const cache = new InMemoryCache({
//     typePolicies: {
//         Query: {
//             fields: {
//                 currentUser: {
//                     read() {
//                         // This will be populated after your initial query
//                         return cache.readQuery({ query: GET_CURRENT_USER })?.currentUser;
//                     }
//                 }
//             }
//         }
//     }
// });


export const createApolloClient = () => {
    return new ApolloClient({
        ssrMode: isServer,
        link: ApolloLink.from([errorLink, authLink, httpLink]),
        cache: new InMemoryCache(),
    });
};

export default createApolloClient();