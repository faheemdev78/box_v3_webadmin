'use client'
import React, { Children, useEffect, useState } from 'react'
import { Alert, Col, message, Row } from 'antd';
import { Image, Button, DevBlock, DndContainers, Icon, SearchBar } from '@/components';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { defaultPageSize } from '@/configs';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import styles from './ProductListSelector.module.scss'

import LIST_DATA from '@/graphql/product/productsQuery.graphql'


const id_gen = (() => {
    let id = 0;
    return () => id++;
})()


function itemParser (data){
    return (<div className={styles.dragable_item_list}>
        <Row gutter={[10]} align="middle">
            <Col>
                {data?.picture?.thumbnails ? 
                    <Image src={`${process.env.NEXT_PUBLIC_CDN_URL}/${data.picture.thumbnails[0]}`} width={50} height={50} alt={data.title} /> :
                    <Icon style={{ fontSize: "50px", color: "#999999" }} icon="image" />
                }
            </Col>
            <Col flex="auto">
                <div style={{ fontWeight: "bold" }}>{data.title}</div>
                <div style={{ fontSize: "10px" }}>{data?.attributes?.toString()}</div>
            </Col>
            <Col>Price: {data.price}</Col>
        </Row>
    </div>)
}

export const ProductListSelector = ({ limit, onSubmit, selected_products }) => {
    
    const [busy, setBusy] = useState(false)
    // const [products, setProducts] = useState([])
    const [containers, setContainers] = useState({
        products: [],
        selected: []
    })

    useEffect(() => {
        setContainers({
            ...containers,
            selected: (selected_products && selected_products.filter(o=>(o._id))) || []
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected_products])

    const [productsQuery, { data, called, loading }] = useLazyQuery(LIST_DATA, { fetchPolicy: 'network-only' });

    const doSearch = async (filter) => {
        setBusy(true)
        // setProducts([]);
        setContainers({
            ...containers,
            products: []
        })

        let _filter = { ...filter }
        if (containers.selected){
            let ids = containers.selected.filter(o=>(o._id)).map(o=>(o._id))
            if (ids && ids.length > 0) Object.assign(_filter, { _id: { $nin: ids } })
        }

        const resutls = await productsQuery({
            variables: {
                limit: defaultPageSize,
                page: 1,
                filter: JSON.stringify(_filter),
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.productsQuery }))
            .catch(catchApolloError)

        setBusy(false)
        if (resutls && resutls.error) {
            message.error(resutls.error.message);
            return;
        }

        // setProducts(resutls && resutls.edges)
        let products = (resutls && resutls.edges) || []
        products = products.filter(o => !containers.selected.find(oo=>oo._id==o._id)) // filter selected products form resutls

        setContainers({ 
            ...containers,
            products
            // products: (resutls && resutls.edges) || []
        })
    }

    const onUpdate = (updates) => setContainers(updates)


    return (<>
        <SearchBar loading={busy} onSearch={doSearch} />
        {(data?.products?.length < 1 && !busy && called) && <Alert title="Error" description="No products found!" showIcon type='warning' />}

        <DndContainers
            onUpdate={onUpdate}
            containers={containers}
            itemParser={itemParser}
            containerProps={{
                products: {
                    title: <h3>Search Results ({(data && data?.productsQuery?.pagination?.totalDocs) || 0})</h3>,
                    className: styles.container,
                },
                selected: {
                    title: <h3>Selected Items ({containers?.selected?.length || 0} / 6)</h3>,
                    className: styles.container,
                    limit: Number(limit || 0),
                }
            }}
            gutter={0}
        />

        <div style={{ height:"20px" }} />
        <Row>
            <Col flex="8" />
            <Col flex="auto" align="center"><Button onClick={() => onSubmit(containers?.selected || [])} color="orange" block>Save</Button></Col>
            <Col flex="8" />
        </Row>

        
        
        {/* <DevBlock obj={containers.selected} /> */}
    </>)
}
