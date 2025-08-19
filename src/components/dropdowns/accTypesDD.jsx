'use client'

import React, { useState, useMemo, useRef } from 'react'
import PropTypes from 'prop-types';
import { gql } from "@apollo/client";
import { SearchableSelect } from '../form';

const SEARCH_QUERY = gql`query userRoles($filter:String){
    userRoles(filter: $filter){
        _id
        title
        acc_type
    }
}`

export const AccTypesDD = (props) => {
    return <SearchableSelect 
        // onChange={(val1, val2, callback) => callback(val2)}
        {...props} 
        // filter={{ status: "online" }}
        query={SEARCH_QUERY} 
        queryName="userRoles"
        // resultParser={(resutls) => resutls.map((o) => ({ _id: o._id, title: `${o.fname || ''} ${o.mname || ''} ${o.lname || ''}` }))}
    />
}
AccTypesDD.propTypes = {
    name: PropTypes.string.isRequired,
    filter: PropTypes.object,
}
