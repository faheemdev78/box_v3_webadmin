'use client'

import React, { useState, useMemo, useRef } from 'react'
import PropTypes from 'prop-types';
import { gql } from "@apollo/client";
import { SearchableSelect } from '../form';

const SEARCH_QUERY = gql`query manufacturers($filter:String, $others:String){
    manufacturers(filter: $filter, others: $others){
        _id
        title
        code
        slug
        img_thumb
    }
}`

export const ManufacturersDD = (props) => {
    return <SearchableSelect 
        // onChange={(val1, val2, callback) => callback(val2)}
        {...props} 
        filter={{ status: "online" }}
        query={SEARCH_QUERY} 
        queryName="manufacturers"
        // resultParser={(resutls) => resutls.map((o) => ({ _id: o._id, title: `${o.fname || ''} ${o.mname || ''} ${o.lname || ''}` }))}
    />
}
ManufacturersDD.propTypes = {
    name: PropTypes.string.isRequired,
    filter: PropTypes.object,
}
