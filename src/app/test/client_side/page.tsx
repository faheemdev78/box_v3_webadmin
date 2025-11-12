'use client'
import Image from "next/image";
import Link from "next/link";
import { useQuery, gql, useLazyQuery } from "@apollo/client";
import { use, useEffect, useState } from "react";
import { getSessionToken } from "@_/lib/auth";

import TEST_QUERY from "@_/graphql/test/testQuery.graphql";

export default function ClientSide() {
    // const { data, loading, error } = useQuery(TEST_QUERY);
    const [session, setSession] = useState(null)   

    const [loadGreeting, { called, loading, data }] = useLazyQuery(TEST_QUERY, { fetchPolicy: "network-only" });

    useEffect(() => {
        if (called) return;
        loadGreeting({ variables: { args: "english" } });

        setSession(getSessionToken())
    }, []);


    if (loading) return <p>Loading...</p>;


    return (<div>       
        <h1>Client Side</h1>
        <p>session: {session}</p>

        <button onClick={() => loadGreeting({ variables: { args: "english" } })}>Reload Query</button>

        <div><pre>{JSON.stringify(data)}</pre></div>

    </div>);
}
