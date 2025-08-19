'use client';

import { useEffect, useState } from "react";
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { ProductsList } from "@_/modules/products";
import { adminRoot, defaultPageSize, defaultPagination } from "@_/configs";
import { Alert, Card, message, Row } from "antd";
import StoreWrapper from "@_/modules/store/storeWrapper";
// import { useSession } from "next-auth/react";
import { Loader } from "@_/components";
import { useDispatch, useSelector } from 'react-redux';
import { checkApolloRequestErrors, catchApolloError } from "@_/lib/utill_apollo";

import LIST_DATA from '@_/graphql/product/productsQuery.graphql'

const defaultFilter = {}; // { status: 'online' }



function StoreProductsHome({ store, session, ...props }) {
    const [state, setState] = useState({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
    })
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    const [productsQuery, { called, loading }] = useLazyQuery(LIST_DATA,
        { variables: { filter: JSON.stringify(state.filter) } }
    );

    useEffect(() => {
        if (called || loading) return
        fetchData({})
    }, [props])

    
    const fetchData = async ({ filter, pagination = {} }) => {
        console.log(__yellow("fetchData()"), { filter, pagination })
        
        const variables = {
            limit: pagination?.pageSize || state.pagination.pageSize,
            page: pagination?.current || state.pagination.current,
            filter: filter || state.filter || {},
            others: state.others || {},
        }

        setBusy(true)
        const resutls = await productsQuery({
            variables: {
                ...variables,
                filter: JSON.stringify(variables.filter || {}),
                others: JSON.stringify(variables.others || {})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.productsQuery }))
            .catch(catchApolloError)

        setBusy(false)

        if (resutls && resutls.error) {
            message.error(resutls.error.message);
            setError(resutls.error.message)
            return;
        }

        setState({
            ...state,
            pagination: {
                ...state.pagination,
                current: resutls.pagination.page,
                total: resutls.pagination.totalDocs,
                // resutls.pagination.totalPages,
                pageSize: resutls.pagination.limit,
            },
            filter: variables.filter,
            dataSource: resutls?.edges?.map(o => ({
                ...o,
                children: o.variations.length > 0 && o.variations,
                variations: undefined
            })),
        })

    }

    if (!session) return <Loader loading={true}>Fetching session...</Loader>

    let columns = ['title', 'barcode', 'variations_count', 'store_price', 'store_qty', 'store_reserved_qty', 'store_status'];
    if (!session?.store_id) columns = undefined; // ['title', 'barcode', 'variations_count', 'status']; // for non-store users

    return (<>
        {error && <Alert message={error} type="error" showIcon />}
        <ProductsList
            {...state}
            busy={busy} setBusy={setBusy}
            fetchData={fetchData}
            searchFilterConfig={props.searchFilterConfig}
            parseEditLink={(record) => (`${adminRoot}/store/${store._id}/product/${record._id}/view`)}
            columns={columns}
        />
    </>)
}

export default function Wrapper(props){
    // const { data: session, status, update } = useSession()
    const session = useSelector((state) => state.session);

    return (<StoreWrapper {...props} render={({ store }) => (<StoreProductsHome session={session} store={store} />)} />)
}
