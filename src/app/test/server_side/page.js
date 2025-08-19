import { gql } from "@apollo/client";
import { getSessionToken } from "@_/lib/auth";
import client from "@_/aClient/client";

import TEST_QUERY from "@_/graphql/test/testQuery.graphql";


export default async function ServerSide(props) {
    console.log("Loading ServerSide page")

    const { data, loading, error } = await client.query({
        query: TEST_QUERY,
        fetchPolicy: "network-only"
        // fetchPolicy: 'cache-and-network',
    });

    const session = await getSessionToken()

    return (<div>
        <h1>Server Side</h1>

        <p>session: {session}</p>

        {loading && <p>Loading....</p>}
        {error && <p>{error}</p>}

        <div><pre>
            {JSON.stringify(data)}
        </pre></div>

    </div>);
}
