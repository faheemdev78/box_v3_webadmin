'use client';

import { useEffect, useState } from "react";
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { __error } from '@/lib/consoleHelper';
import { ProductsList } from "@/modules/products";
import { adminRoot, defaultPageSize, defaultPagination } from "@/configs";
import { Card, message, Row } from "antd";
import { catchApolloError, checkApolloRequestErrors } from "@/lib/utill_apollo";

import LIST_DATA from '@/graphql/product/productsQuery.graphql'

const defaultFilter = {}; // { status: 'online' }

interface StateType {
    pagination: typeof defaultPagination;
    pageView: string;
    dataSource: any[] | null;
    filter: any;
    others?: any;
}

function ProductsListPage() {
    const [state, setState] = useState<StateType>({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
    })
    const [busy, setBusy] = useState(false)

    const [productsQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    const fetchData = async ({ filter, pagination = {} }: { filter?: any; pagination?: any }) => {
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
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.productsQuery }))
            .catch(catchApolloError)
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
            dataSource: resutls?.edges?.map((o: any) => ({
                ...o,
                children: o?.variations?.length > 0 && o.variations,
                variations: undefined
            })),
        })

    }

    useEffect(() => {
        if (called || loading) return
        fetchData({ filter: defaultFilter })
    }, [called, loading])


    return (<>
        <ProductsList
            {...state}
            busy={busy}
            setBusy={setBusy}
            fetchData={fetchData}
            loading={loading}
            parseEditLink={(prod: any) => `${adminRoot}/product/${prod._id}/view`}
            searchFilterConfig={undefined}
            // onEditRecord={(prod) => router.push(`${adminRoot}/product/${prod._id}/view`)}
        />
    </>)
}

export default ProductsListPage;
