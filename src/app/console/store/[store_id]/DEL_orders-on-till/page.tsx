'use client';

import { useEffect, useState } from "react";
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { adminRoot, defaultPageSize, defaultPagination } from "@_/configs";
import { Card, message, Row } from "antd";
import { catchApolloError, checkApolloRequestErrors } from "@_/lib/utill_apollo";
import OrdersList from "@_/modules/orders/ordersList";
import { DevBlock, usePageProps } from '@_/components';

import LIST_DATA from '@_/graphql/order/ordersQuery.graphql'
import Link from "next/link";

const defaultFilter = {}; // { status: 'online' }

export default  function ProductsListPage(props) {
    const { store } = usePageProps()

    const permanentFilter = {
        'store._id': store._id,
        current_stage: "picking-complete",
        locked_by: { $eq: null },
        'status.order': 'processing'
    }
    
    const [state, setState] = useState({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
    })
    const [busy, setBusy] = useState(false)

    const [ordersQuery, { called, loading }] = useLazyQuery(LIST_DATA,
        { variables: { filter: JSON.stringify({ ...state.filter, ...permanentFilter }) } }
    );
  
    const fetchData = async ({ filter, pagination={} }) => {
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
                filter: JSON.stringify({ ...variables.filter, ...permanentFilter }),
                others: JSON.stringify(variables.others || {})
            }
         })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.ordersQuery }))
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
    }, [props])
    
    const columns = [
        { 
            key: 'serial',
            render: (_, rec) => {
                // console/store/[store_id]/order-on-till/verify/[serial]/page.tsx
                return <Link href={`${adminRoot}/store/${store._id}/order-on-till/verify/${rec.serial}/`}>{rec.serial}</Link>
            }
        }, 
        'store', 'customer', 'original_order', 'delivery_slot', 'createdAt'
    ]


    return (<>
        <OrdersList
            {...state}
            columns={columns}
            busy={busy} setBusy={setBusy}
            fetchData={fetchData}
            searchFilterConfig={props.searchFilterConfig}
            // onEditRecord={(prod) => router.push(`${adminRoot}/product/${prod._id}/view`)}
        />
    </>)
}
