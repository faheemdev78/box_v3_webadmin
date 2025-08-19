'use client'

import PropTypes from 'prop-types';
import { SearchableSelect } from '../form';
// import { gql } from "@apollo/client";

import SEARCH_QUERY from '@_/graphql/product/products.graphql'

// const SEARCH_QUERY = gql`query instructors($filter:String, $others:String){
//     instructors(filter: $filter, others: $others){
//         _id name
//     }
// }`

export const ProductsDD = (props) => {
    return <SearchableSelect
        static_filter={{}}
        filter={{}}
        {...props}
        query={SEARCH_QUERY}
        queryName="products"
        resultParser={(resutls) => resutls.map((o) => ({
            value: o._id,
            title: `${o.title}`,
            raw: o,
        }))}
    />
}
ProductsDD.propTypes = {
    name: PropTypes.string.isRequired,
}

export default ProductsDD;
