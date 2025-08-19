'use client'

import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import DevBlock from './devBlock';
import { Loader } from './loader';
import { Card, Space } from 'antd';
import { Icon } from './icon';

import SEARCH_QUERY from '@_/graphql/product_attributes/productAttributes.graphql'

// const SEARCH_QUERY = gql`query instructors($filter:String, $others:String){
//     instructors(filter: $filter, others: $others){
//         _id name
//     }
// }`

export const ProdAttributesSelector = ({ initialValues=[], onUpdate }) => {
    const [selection, set_selection] = useState(initialValues)

    const [productAttributes, { data, called, loading }] = useLazyQuery(
        SEARCH_QUERY,
        // { variables: { filter: JSON.stringify({}) } }
    );
    
    useEffect(() => {
        if (called || loading) return;
        productAttributes()
    }, [])

    const onItemClick = (item) => {
        let found = selection.find(o=>o._id==item._id)
        let _selection = selection.slice();

        if (found) _selection = selection.filter(o=>(o._id!==item._id))
        else _selection.push(item)

        onUpdate(_selection);
        set_selection(_selection);
    }

    if (loading) return <Loader loading={true} />

    return (<>
        <Space style={{ width:"100%" }} direction='vertical'>
            {data && data?.productAttributes?.map((item, i) => {
                return (<Card key={i} onClick={() => onItemClick(item)} styles={{ body:{ padding:"10px", fontSize:"16px" }}}>
                    <Space>
                        {selection.find(o => o._id == item._id) ? <Icon icon="square-check" /> : <Icon icon="square" color="#DDD" />}
                        <span>{item.title}</span>
                    </Space>
                </Card>)
            })}
        </Space>
        {/* <DevBlock obj={data} /> */}
    </>)
}
ProdAttributesSelector.propTypes = {
    name: PropTypes.string.isRequired,
}

export default ProdAttributesSelector;
