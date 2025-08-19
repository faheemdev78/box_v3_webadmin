'use client'

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import _ from 'lodash'
import { Col, message, Row, Space, Switch, Tree, TreeSelect, Select as AntSelect, Button } from 'antd';
import { useLazyQuery, gql } from '@apollo/client';
import { Field } from 'react-final-form'
import { Icon } from './icon';
import { Loader } from './loader';

// import SEARCH_QUERY from '@_/graphql/product_cat/productCats.graphql'
const SEARCH_QUERY = gql`query productCats($filter:String, $others:String){
    productCats(filter: $filter, others: $others){
        _id title slug status _id_parent_cat
    }
}`


const constructCategoryArray = (allCats, parent = null) => {
    if (!allCats) return []

    let arr = allCats.filter(o => o._id_parent_cat == parent).map(item => ({
        ...item,
        children: constructCategoryArray(allCats, item._id),
    }))

    return arr;
}

const getParents = (ids, arr, newarr = []) => {
    // console.log(__yellow("getParents()"), ids)

    let _newarr = newarr.slice();

    ids.forEach(row => {
        // _id_parent_cat
        let el = arr.find(o => o._id == row.value)
        if (el && !_newarr.find(oo => oo._id == row.value)) {
            _newarr.push(el)
            if (el._id_parent_cat) {
                _newarr = getParents([{ value: el._id_parent_cat }], arr, _newarr)
                // newarr.push(arr.find(o => o._id == el._id_parent_cat))
            }
        }
    });

    // console.log("newarr: ", newarr)

    return _newarr;

    // arr.map(o=>(o._id==id))
}

export const ProdCatTreeSelection = (props) => {
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [arrayData, set_arrayData] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState();
    
    const onExpand = (expandedKeysValue) => {
        setExpandedKeys(expandedKeysValue);
        setAutoExpandParent(false);
    }

    const [productCats, { called, loading }] = useLazyQuery(
        SEARCH_QUERY,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (called || loading) return;
        fetchData()
    }, [props, called, loading])

    const fetchData = async() => {
        let resutls = await productCats().then(r => (r?.data?.productCats))
        .catch(err=>{
            console.log(__error("Error: "), err)
            return { error:{message:"Unable to fetch categories"}}
        })

        if (!resutls || resutls.error){
            message.error((resutls && resutls?.error?.message) || "No categories found!")
            return false;
        }
        resutls = resutls.map(o=>({ ...o, key:o._id }))

        set_arrayData(constructCategoryArray(resutls))
    }
    
    return (<>
        <Field name={props.name} disabled={!!props.disabled} validate={props.validate}>
            {({ input, meta }) => {
                let onChange = (selectedKeysValue, info) => {

                    let prev = input?.value?.slice() || [];
                    let found = prev.find(o => (o._id == info.node._id))
                    
                    if (!found) prev.push({ _id: info.node._id, title: info.node.title })
                    else prev = prev.filter(o => !(o._id == info.node._id))

                    input.onChange(prev)
                    if (props.onChange) props.onChange(prev, input.onChange);
                }

                const selectedKeys = (input.value && input?.value?.map(o => (o._id))) || [];

                if (loading || !arrayData || arrayData.length < 1) return <Loader loading={true} />

                return (<>
                    <Tree
                        checkable={false} showLine showIcon
                        icon={(args) => {
                            let found = selectedKeys.find(o => (o == args._id))
                            if (found) return <Icon icon="square-check" style={{ fontSize: "18px", color:"#2D3E52" }} />
                            return <Icon icon="square" style={{ fontSize: "18px", color: "#DDD" }} />
                        }}
                        onExpand={onExpand}
                        expandedKeys={expandedKeys}
                        autoExpandParent={autoExpandParent}
                        defaultExpandAll={true}
                        onSelect={onChange}
                        selectedKeys={selectedKeys}
                        treeData={arrayData}
                    />
                </>)

            }}
        </Field>

    </>)

}

// export const ProdCatSelection = (props) => {
//     return <SearchableSelect
//         static_filter={{  }}
//         filter={{  }}
//         {...props}
//         query={SEARCH_QUERY}
//         queryName="productCats"
//         resultParser={(resutls) => resutls.map((o) => ({
//             value: o._id,
//             title: `${o.title}`,
//             raw: o,
//         }))}
//     />
// }
ProdCatTreeSelection.propTypes = {
    name: PropTypes.string.isRequired,
}

export default ProdCatTreeSelection;
