import { isServer } from "@_/lib";
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getSessionToken } from "@_/lib/auth";




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
        link: ApolloLink.from([authLink, httpLink]),
        cache: new InMemoryCache(),
    });
};

export default createApolloClient();