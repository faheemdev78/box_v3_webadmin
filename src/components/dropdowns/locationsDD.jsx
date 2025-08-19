'use client'

import PropTypes from 'prop-types';
import { SearchableSelect } from '../form';
// import { gql } from "@apollo/client";

import SEARCH_QUERY from '@_/graphql/location/locations.graphql'

// const SEARCH_QUERY = gql`query instructors($filter:String, $others:String){
//     instructors(filter: $filter, others: $others){
//         _id name
//     }
// }`

export const LocationsDD = (props) => {
    return <SearchableSelect
        static_filter={{}}
        filter={{}}
        {...props}
        query={SEARCH_QUERY}
        queryName="locations"
        resultParser={(resutls) => resutls.map((o) => ({
            value: o._id,
            title: `${o.title}`,
            raw: o,
        }))}
    />
}
LocationsDD.propTypes = {
    name: PropTypes.string.isRequired,
}

export default LocationsDD;
