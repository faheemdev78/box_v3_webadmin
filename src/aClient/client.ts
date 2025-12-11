import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError, ErrorLink } from "@apollo/client/link/error";
import { clearSessionToken, getSessionToken } from "@/lib/auth";
import { handleRedirectLogin } from "@/lib/redirect";
import { app_ver } from "@/configs";


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

const authLink = setContext((_, previousContext) => {
    const contextToken = previousContext?.authToken;
    const headers = previousContext?.headers ?? {};
    const token = contextToken ?? (typeof window !== "undefined" ? getSessionToken() : "");
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
        ssrMode: typeof window === "undefined",
        link: ApolloLink.from([errorLink, authLink, httpLink]),
        cache: new InMemoryCache(),
    });
};

export default createApolloClient();
