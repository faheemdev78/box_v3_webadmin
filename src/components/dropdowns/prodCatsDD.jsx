'use client'

import PropTypes from 'prop-types';
import { SearchableSelect } from '../form';
import { gql } from "@apollo/client";

const SEARCH_QUERY = gql`query productCats($filter:String, $others:String){
    productCats(filter: $filter, others: $others){
        _id title slug _id_parent_cat parent_cat_title
    }
}`

export const ProdCatsDD = (props) => {
    return <SearchableSelect
        static_filter={{  }}
        filter={{  }}
        {...props}
        query={SEARCH_QUERY}
        queryName="productCats"
        resultParser={(resutls) => resutls.map((o) => ({
            value: o._id,
            label: `${o.title}`,
            raw: o,
        }))}
    />
}
ProdCatsDD.propTypes = {
    name: PropTypes.string.isRequired,
}

export default ProdCatsDD;
