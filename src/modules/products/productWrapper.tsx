'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Alert, Card, Col, message, Row, Space } from 'antd';
import { Button, DevBlock, Loader, StatusTag } from '@/components';
import { adminRoot, publishStatus } from '@/configs';
import Link from 'next/link';
import security from '@/lib/security';
// import { useSession } from 'next-auth/react';
// import { useDispatch, useSelector } from 'react-redux';
import { useAppSelector } from '@/rStore/hooks';
import { Page } from '@/template/page';
import { PageHeader } from '@/template';
import { useParams } from 'next/navigation';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { __yellow } from '@/lib/consoleHelper';

import GET_PRODUCT from '@/graphql/product/product.graphql';
import UPDATE_STATUS from '@/graphql/product/updateProductStatus.graphql'


interface ProductWrapperRenderArgs {
    product: any;
    session: any;
    store: any;
    refresh: () => Promise<any>;
}

interface ProductWrapperProps {
    render: (args: ProductWrapperRenderArgs) => React.ReactNode;
    store?: any;
    [key: string]: unknown;
}

interface StatusUpdateValues {
    status: string;
    status_notes?: string;
}

export function ProductWrapper({ render, store, ...props }: ProductWrapperProps) {
    const session = useAppSelector((state: any) => state.session) as any;
    const { prod_id, store_id: route_store_id } = useParams<{ prod_id: string, store_id?: string }>()
    // const { prod_id, store_id } = useParams < { prod_id: string, store_id: string } > ()

    const store_id = route_store_id || session?.user?.store?._id;
    const variables = useMemo(() => {
        const vars = { _id: prod_id }
        if (store_id) Object.assign(vars, { _id_store: store_id })
        return vars
    }, [prod_id, store_id])

    const [fatelError, set_fatelError] = useState<string | null>(null)
    const [data, setData] = useState<any>(null)

    const [get_product, { loading }] = useLazyQuery(GET_PRODUCT, { fetchPolicy: 'network-only' });
    const [updateProductStatus, status_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    const fetchData = useCallback(async () => {
        if (!prod_id) return;
        // console.log(__yellow("fetchData()"))

        let resutls = await get_product({ variables })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.product }))
            .catch(catchApolloError)
        // console.log("resutls: ", resutls)

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Product not found!")
            return;
        }

        setData(resutls)
        return resutls;
    }, [get_product, prod_id, variables])
    
    useEffect(() => {
        if (!prod_id) return;
        void fetchData();
    }, [fetchData, prod_id])

    const onStatusUpdate = async (values: StatusUpdateValues) => {
        if (!data?._id) {
            message.error("Invalid product state");
            return;
        }

        let resutls = await updateProductStatus({ variables: { _id: data._id, status: values.status } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.updateProductStatus }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            message.error((resutls && resutls?.error?.message) || "Unable to update product!");
            return;
        }

        setData(resutls)

        // set_initialValues(resutls)
        return resutls.status;
    }


    // if (status == 'loading') return <Loader loading={true} />
    if (!prod_id || fatelError) return <Alert title="Error" description={fatelError || "No Product ID found!"} type='error' showIcon />
    if (loading || !data || !data?._id) return <Loader loading={true}>Fetching product...</Loader>
    
    const isStoreUser = !!(session?.user?.store?._id);
    // if (isStoreUser && store && store._id !== session?.user?.store?._id) return <Alert title="Error" description="Unauthorized store access!" type='error' showIcon />

    const canEdit = security.verifyRole('104.4', session?.user?.permissions);

    return (<>
        <PageHeader 
            title={data.title}
            sub={<Space separator="|">
                <div>ID: {data?._id}</div>
                <div><StatusTag value={data.status} editable={canEdit && !isStoreUser} options={publishStatus} onSubmit={onStatusUpdate} /></div>
                <Button onClick={()=>fetchData()}>Refresh</Button>
            </Space>}
        >
            {data?._id_parent && (isStoreUser
                ? <Link href={`${adminRoot}/store/${store_id}/product/${data?._id_parent}/view`}>Parent Product</Link>
                : <Link href={`${adminRoot}/product/${data?._id_parent}/view`}>Parent Product</Link>
            )}
        </PageHeader>
        {/* <hr /> */}

        {/* <DevBlock obj={session?.user?.store} title={store_id} /> */}

        <Page>
            {render({
                product: data,
                session,
                store: store_id ? (session?.user?.store || null) : null,
                refresh: fetchData
            })}
        </Page>

    </>)

}
export default ProductWrapper
