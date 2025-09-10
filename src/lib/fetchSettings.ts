// import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client/core';
// import fetch from 'cross-fetch';
import { createApolloClient } from '@_/aClient/client';
import { catchApolloError, checkApolloRequestErrors } from './utill_apollo';
import { utcToDate } from './utill';

import GET_CONFIGS from '@_/graphql/settings/getSystemConfigs.graphql';


export async function fetchSettings() {
    const client = createApolloClient();

    const results = await client.query({ 
        query: GET_CONFIGS,
        fetchPolicy: 'network-only',
    })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.getSystemConfigs }))
        .catch(catchApolloError)

    if (results.error) return results;
    if (results.length < 1) return { error: { message:"No settings found"} };

    let configs = {}
    results.forEach(row => {
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


