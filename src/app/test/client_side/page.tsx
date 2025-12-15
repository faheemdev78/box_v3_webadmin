'use client'
import { useQuery, useLazyQuery } from "@apollo/client/react";
import { use, useEffect, useState } from "react";
import { getSessionToken } from "@/lib/auth";

import TEST_QUERY from "@/graphql/test/testQuery.graphql";

function ClientSide() {
    // const { data, loading, error } = useQuery<any>(TEST_QUERY);
    const [session, setSession] = useState<string | null>(null)   

    const [loadGreeting, { called, loading, data }] = useLazyQuery<any>(TEST_QUERY, { fetchPolicy: "network-only" });

    useEffect(() => {
        if (called) return;
        loadGreeting({ variables: { args: "english" } });
        Promise.resolve(getSessionToken()).then(token => setSession(token as any)).catch(() => setSession(null))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    if (loading) return <p>Loading...</p>;


    return (<div>       
        <h1>Client Side</h1>
        <p>session: {session}</p>

        <button onClick={() => loadGreeting({ variables: { args: "english" } })}>Reload Query</button>

        <div><pre>{JSON.stringify(data)}</pre></div>

    </div>);
}

export default ClientSide
