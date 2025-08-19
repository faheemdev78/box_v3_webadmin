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

    const [loadGreeting, { called, loading, data }] = useLazyQuery(
        TEST_QUERY,
        { variables: { args: "english" }, fetchPolicy: "network-only" }
    );

    useEffect(() => {
        if (called) return;
        loadGreeting();

        setSession(getSessionToken())
    }, []);


    if (loading) return <p>Loading...</p>;


    return (<div>       
        <h1>Client Side</h1>
        <p>session: {session}</p>

        <button onClick={() => loadGreeting()}>Reload Query</button>

        <div><pre>{JSON.stringify(data)}</pre></div>

    </div>);
}
