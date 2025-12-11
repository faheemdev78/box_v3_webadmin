import React, { Component, useEffect } from 'react'
import { Spin, message, Row, Col } from 'antd';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
import debounce from 'lodash/debounce';
import { FormField, SearchField } from '@/components/form'
// import { FormField, FormFieldGroup, SubmitButton, rules, submitHandler } from '@/components/form';
import { __error } from '@/lib/consoleHelper';
import { Loader, IconButton, Drawer, Button, DevBlock, Heading, Avatar } from '@/components'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_PRODUCTS from '@/graphql/product/products_short_list.graphql';


export const ProductSelector = props => {
    const [get_products_short_list, { called, loading, error, data }] = useLazyQuery(GET_PRODUCTS, { fetchPolicy: "no-cache" });
    // const [changeUserPickupAllow, update_details] = useMutation(UPDATE_PICKUP_ALLOW);
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });
    

    const [list, setList] = React.useState([]);
    const [state, setState] = React.useState({});
    const [showList, setShowList] = React.useState(false);

    const toggleDrawer = args => setShowList(!showList);

    var lastFetchId = 0; 
    const _fetchData = async (value) => {
        if (!value || value.length < 3) return;
        lastFetchId += 1;
        const fetchId = lastFetchId;
    
        setState({ kw: value, loading: true })
        
        let filter = { search: { keywords: value }, status:'published' };

        if (props.blockIds && props.blockIds.length > 0 && props.blockIds[0]) {
            filter = Object.assign(filter, { _id: { $nin: props.blockIds } });
        }

        filter = JSON.stringify(filter);

        let resutls = await get_products_short_list({ variables: { filter } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.products }))
            .catch(catchApolloError)

        if (resutls && resutls?.error?.message) {
            message.error((resutls && resutls?.error?.message) || "Invalid response!");
            setState({ loading: false })
            return false;
        }
        setList(e.data.products)
        setState({ loading: false })
    }
    const fetchData = debounce(_fetchData, 800);

   
    return (<>
        <div className="grid-block-" >
            <div style={{textAlign:"right"}}><Button size="small" onClick={toggleDrawer}>Manage {props.label}</Button></div>
            {props.children}
        </div>

        <Drawer width={400} destroyOnClose maskClosable={true} placement="right" onClose={toggleDrawer} visible={showList} title={`Manage Products`}><>
            
            <SearchField
                type="search"
                name={props.name}
                onSearch={(e) => fetchData(e)}
                onChange={(e) => fetchData(e.target.value)}
                loading={state.loading}
                style={{marginBottom:"10px"}}
            />

            {list.map((item, i) => {
                return (<Row key={i} className="date-row" gutter={[5, 0]} style={{ flexWrap: "nowrap" }}>
                    <Col flex="30px"><Avatar size={40} shape="square" src={`${process.env.REACT_APP_DATA_URL}/${item.picture_thumb}`} /></Col>
                    <Col flex="auto"><div style={{ flexWrap: "wrap", whiteSpace: "normal" }}>{item.title}</div></Col>
                    <Col flex="20px"><IconButton onClick={()=>props.onAddClick(item)} icon="plus" /></Col>
                </Row>)
            })}

        </></Drawer>

    </>)
}
export default ProductSelector;
