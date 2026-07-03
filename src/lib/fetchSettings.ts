// import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client/core';
// import fetch from 'cross-fetch';
import { createApolloClient } from '@/aClient/client';
import { catchApolloError, checkApolloRequestErrors } from './utill_apollo';
// import { utcToDate } from './utill';

import GET_CONFIGS from '@/graphql/settings/getSystemConfigs.graphql';


export async function fetchSettings() {
    // console.log("fetchSettings()")

    const client = createApolloClient();
    // console.log("client: ", client)

    const results = await client.query({ 
        query: GET_CONFIGS,
        fetchPolicy: 'network-only',
    })
    .then(r=>{
        // console.log("fetchSettings > R: ", r)
        return r;
    })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: { data?: { getSystemConfigs?: any[] } }) => rr?.data?.getSystemConfigs }))
        .catch(catchApolloError)

    if (!results || results.error) {
        const err:any = results || { error: { message: "Empty Settings fetched!" } };
        console.error(err)
        return err;
    }
    if (results.length < 1) return { error: { message:"No settings found"} };

    const configs: Record<string, any> = {}
    results.forEach((row: any) => {
        let value = row.value;
        if (row.value_type === 'number') value = parseFloat(row.value);
        if (row.value_type === 'boolean') value = row.value === 'true';
        if (row.value_type === 'json') value = JSON.parse(row.value);
        // if (row.value_type === 'date') value = utcToDate(row.value);
        // if (row.value_type === 'datetime') value = utcToDate(row.value, true);

        Object.assign(configs, { [row.field_name]: value })
    });

    return configs;
    // return data?.configs ?? {}; // shape: { lang: "eng", tz: "lahore" }
}

