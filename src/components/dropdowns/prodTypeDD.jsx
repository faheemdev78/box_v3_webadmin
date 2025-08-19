'use client'

import PropTypes from 'prop-types';
import { SearchableSelect } from '../form';
// import { gql } from "@apollo/client";

import SEARCH_QUERY from '@_/graphql/product_type/prodTypes.graphql'

// const SEARCH_QUERY = gql`query instructors($filter:String, $others:String){
//     instructors(filter: $filter, others: $others){
//         _id name
//     }
// }`

export const ProdTypeDD = (props) => {
    // title: { type: String },
    // slug: { type: String, default: null, set: v => string_to_slug(v) },
    // tax: { type: TaxFragSchema },
    // attributes: { type: [Prod_AttributesSchemaReff] },

    return <SearchableSelect
        // static_filter={{  }}
        // filter={{  }}
        {...props}
        query={SEARCH_QUERY}
        queryName="prodTypes"
        resultParser={(resutls) => resutls.map((o) => {
            return {
                value: o._id,
                title: o.title,
                raw: o,
            }
        })}
    />
}
ProdTypeDD.propTypes = {
    name: PropTypes.string.isRequired,
}

export default ProdTypeDD;
