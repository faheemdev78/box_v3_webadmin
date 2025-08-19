'use client'

import PropTypes from 'prop-types';
import { SearchableSelect } from '../form';
// import { gql } from "@apollo/client";

// const SEARCH_QUERY = gql`query skills($filter:String, $others:String){
//     skills(filter: $filter, others: $others){
//         _id title
//     }
// }`

import SEARCH_QUERY from '@_/graphql/user_role/userRoles.graphql'


export const UserTypeDD = (props) => {
    let _props = { ...props }
    // delete _props.type;
    // if (!props.type) return <Alert message="Category type not provided" showIcon type='error' />

    return <SearchableSelect 
        static_filter={{  }}
        filter={{ }}
        {..._props} 
        query={SEARCH_QUERY} 
        queryName="userRoles"
        resultParser={(resutls) => resutls?.map((o) => ({ 
            value: o.acc_type, 
            title: `${o.title}`,
            raw: o,
        }))}
    />
}
UserTypeDD.propTypes = {
    name: PropTypes.string.isRequired,
    // type: PropTypes.string.isRequired,
}
