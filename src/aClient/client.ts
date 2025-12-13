import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";
// import { setContext } from "@apollo/client/link/context";
import { SetContextLink } from "@apollo/client/link/context";
// import { onError } from "@apollo/client/link/error";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors, CombinedProtocolErrors } from "@apollo/client/errors";
import { clearSessionToken, getSessionToken } from "@/lib/auth";
import { handleRedirectLogin } from "@/lib/redirect";
import { app_ver } from "@/configs";


// Error link
// Log any GraphQL errors, protocol errors, or network error that occurred
const errorLink = new ErrorLink(({ error, operation }) => {
    console.log("ErrorLink >> error: ", error)

    if (CombinedGraphQLErrors.is(error)) {
        error.errors.forEach(({ message, locations, path }) =>
            console.log(
                `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
        );
    } else if (CombinedProtocolErrors.is(error)) {
        error.errors.forEach(({ message, extensions }) =>
            console.log(
                `[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(
                    extensions
                )}`
            )
        );
    } else {
        console.error(`[Network error]: ${error}`);
    }
});
// const errorLink = onError(({ graphQLErrors, networkError }) => {
//     if (graphQLErrors) {
//         for (let err of graphQLErrors) {
//             if (err.extensions?.code === "UNAUTHENTICATED") {
//                 console.warn("Session expired or invalid token");

//                 // Clear token (cookie/localStorage)
//                 // document.cookie = "your_token_cookie=; Max-Age=0; path=/";
//                 clearSessionToken().then(r=>{
//                     // Redirect to login
//                     handleRedirectLogin
//                 });
//             }
//         }
//     }

//     if (networkError) {
//         console.error("Network error:", networkError);
//     }
// });

const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URI,
    credentials: "include",
});


const authLink = new SetContextLink((prevContext, operation) => {
    // const token = getAuthToken();
    const contextToken = prevContext?.authToken;
    const headers = prevContext?.headers ?? {};
    const token = contextToken ?? (typeof window !== "undefined" ? getSessionToken() : "");

    return {
        headers: {
            // authorization: token ? `Bearer ${token}` : "",
            ...headers,
            Authorization: token ? `Bearer ${token}` : "",
            'x-app-ver': app_ver,
        },
    };

    // return {
    //     credentials: "include",
    //     // ...
    // };
});

// const authLink = setContext((_, previousContext) => {
//     const contextToken = previousContext?.authToken;
//     const headers = previousContext?.headers ?? {};
//     const token = contextToken ?? (typeof window !== "undefined" ? getSessionToken() : "");
//     return {
//         headers: {
//             ...headers,
//             Authorization: token ? `Bearer ${token}` : "",
//             'x-app-ver': app_ver,
//         },
//     };
// });


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
    console.log("Apollo link: ", process.env.NEXT_PUBLIC_GRAPHQL_URI);
    
    return new ApolloClient({
        ssrMode: typeof window === "undefined",
        link: ApolloLink.from([errorLink, authLink, httpLink]),
        cache: new InMemoryCache(),
    });
};

export default createApolloClient();
