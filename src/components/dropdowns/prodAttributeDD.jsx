'use client'

import PropTypes from 'prop-types';
import { SearchableSelect } from '../form';
// import { gql } from "@apollo/client";

import SEARCH_QUERY from '@_/graphql/product_attributes/productAttributes.graphql'

// const SEARCH_QUERY = gql`query instructors($filter:String, $others:String){
//     instructors(filter: $filter, others: $others){
//         _id name
//     }
// }`

export const ProdAttributeDD = (props) => {
    return <SearchableSelect
        static_filter={{  }}
        filter={{  }}
        {...props}
        query={SEARCH_QUERY}
        queryName="productAttributes"
        resultParser={(resutls) => resutls.map((o) => ({
            value: o._id,
            title: `${o.title}`,
            raw: o,
        }))}
    />
}
ProdAttributeDD.propTypes = {
    name: PropTypes.string.isRequired,
}

export default ProdAttributeDD;
