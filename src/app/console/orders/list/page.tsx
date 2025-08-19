'use client';

import { useEffect, useState } from "react";
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { ProductsList } from "@_/modules/products";
import { adminRoot, defaultPageSize, defaultPagination } from "@_/configs";
import { Card, message, Row } from "antd";
import { checkApolloRequestErrors } from "@_/lib/utill_apollo";

import LIST_DATA from '@_/graphql/product/productsQuery.graphql'

const defaultFilter = {}; // { status: 'online' }

function ProductsListPage(props) {
    const [state, setState] = useState({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
    })
    const [busy, setBusy] = useState(false)

    const [productsQuery, { called, loading }] = useLazyQuery(LIST_DATA,
        { variables: { filter: JSON.stringify(state.filter) } }
    );
  
    const fetchData = async ({ filter, pagination={} }) => {
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
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Invalid response!" } }
            })
        setBusy(false)

        if (resutls && resutls.error) {
            message.error(resutls.error.message);
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
                children: o?.variations?.length > 0 && o.variations,
                variations: undefined
            })),
        })

    }

    useEffect(() => {
        if (called || loading) return
        fetchData({})
    }, [props])
    

    return (<>
        <ProductsList
            {...state}
            busy={busy} setBusy={setBusy}
            fetchData={fetchData}
            searchFilterConfig={props.searchFilterConfig}
            // onEditRecord={(prod) => router.push(`${adminRoot}/product/${prod._id}/view`)}
        />
    </>)
}

export default ProductsListPage;
