'use client'

import PropTypes from 'prop-types';
import { SearchableSelect } from '../form';
import { gql } from "@apollo/client";

const SEARCH_QUERY = gql`query users($filter:String, $others:String){
    users(filter: $filter, others: $others){
        _id name fname mname lname
        store { _id title }
    }
}`

// import SEARCH_QUERY from '@_/graphql/user_role/userRoles.graphql'


export const UsersDD = (props) => {
    let _props = { ...props }
    // delete _props.type;
    // if (!props.type) return <Alert message="Category type not provided" showIcon type='error' />

    return <SearchableSelect 
        // static_filter={{  }}
        // filter={{ }}
        {..._props} 
        query={SEARCH_QUERY} 
        queryName="users"
        resultParser={(resutls) => resutls?.map((o) => ({ 
            value: o._id, 
            title: `${o.name}`,
            raw: o,
        }))}
    />
}
UsersDD.propTypes = {
    name: PropTypes.string.isRequired,
    // type: PropTypes.string.isRequired,
}
