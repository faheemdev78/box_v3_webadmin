import { gql } from "@apollo/client";
import { getServerSessionToken } from "@_/lib/auth/server";
import client from "@_/aClient/client";

import TEST_QUERY from "@_/graphql/test/testQuery.graphql";


export default async function ServerSide() {
    const token = await getServerSessionToken();

    const { data, loading, error } = await client.query({
        query: TEST_QUERY,
        fetchPolicy: "network-only",
        context: { authToken: token },
    });

    return (<div>
        <h1>Server Side</h1>

        <p>session: {token}</p>

        {loading && <p>Loading....</p>}
        {error && <p>{error}</p>}

        <div><pre>
            {JSON.stringify(data)}
        </pre></div>

    </div>);
}
