'use client';

import { useEffect, useState } from "react";
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { adminRoot, defaultPageSize, defaultPagination } from "@_/configs";
import { Card, message, Row } from "antd";
import { catchApolloError, checkApolloRequestErrors } from "@_/lib/utill_apollo";
import OrdersList from "@_/modules/orders/ordersList";

import LIST_DATA from '@_/graphql/order/ordersQuery.graphql'

const defaultFilter = {}; // { status: 'online' }

type PaginationArgs = { pageSize?: number; current?: number };
type FetchArgs = { filter?: any; pagination?: PaginationArgs };

interface StateType {
    pagination: typeof defaultPagination;
    pageView: string;
    dataSource: any[] | null;
    filter: any;
    others?: any;
}

type PageProps = { params?: any; searchParams?: any };

function ProductsListPage(_props: PageProps) {
    const [state, setState] = useState<StateType>({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
        others: {},
    })
    const [busy, setBusy] = useState(false)

    const [ordersQuery, { called, loading }] = useLazyQuery(LIST_DATA, { fetchPolicy: 'network-only' });
  
    const fetchData = async ({ filter, pagination = {} }: FetchArgs = {}) => {
        const variables = {
            limit: pagination?.pageSize || state.pagination.pageSize,
            page: pagination?.current || state.pagination.current,
            filter: filter || state.filter || {},
            others: state.others || {},
        }

        // setBusy(true)
        const resutls = await ordersQuery({ 
            variables: {
                ...variables,
                filter: JSON.stringify(variables.filter || {}),
                others: JSON.stringify(variables.others || {})
            }
         })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.ordersQuery }))
            .catch(catchApolloError)
        // setBusy(false)

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
            dataSource: resutls?.edges,
            // dataSource: resutls?.edges?.map(o => ({
            //     ...o,
            //     children: o?.variations?.length > 0 && o.variations,
            //     variations: undefined
            // })),
        })

    }

    useEffect(() => {
        if (called || loading) return
        fetchData({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called, loading])
    

    return (<>
        <OrdersList
            {...state}
            dataSource={state.dataSource || []}
            pagination={{ ...state.pagination, size: undefined }}
            busy={busy} setBusy={setBusy}
            fetchData={fetchData}
            searchFilterConfig={(_props as any).searchFilterConfig}
            // onEditRecord={(prod) => router.push(`${adminRoot}/product/${prod._id}/view`)}
        />
    </>)
}

export default ProductsListPage;
