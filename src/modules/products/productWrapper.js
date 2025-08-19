'use client'
import React, { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Alert, Card, Col, message, Row, Space } from 'antd';
import { Button, DevBlock, Loader, StatusTag } from '@_/components';
import { adminRoot, publishStatus } from '@_/configs';
import Link from 'next/link';
import security from '@_/lib/security';
// import { useSession } from 'next-auth/react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppSelector } from '@_/rStore/hooks';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';
import { useParams } from 'next/navigation';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __yellow } from '@_/lib/consoleHelper';

import GET_PRODUCT from '@_/graphql/product/product.graphql';
import UPDATE_STATUS from '@_/graphql/product/updateProductStatus.graphql'


export function ProductWrapper({ render, store, ...props }) {
    const session = useAppSelector(({ session }) => session);
    const { prod_id, ...params } = useParams()
    // const { prod_id, store_id } = useParams < { prod_id: string, store_id: string } > ()
    let variables = { _id: prod_id }

    const store_id = params.store_id || session?.user?.store?._id;
    if (store_id) Object.assign(variables, { _id_store: store_id })

    const [fatelError, set_fatelError] = useState(null)
    const [data, setData] = useState(null)

    const [get_product, { loading, called }] = useLazyQuery(GET_PRODUCT);
    const [updateProductStatus, status_details] = useMutation(UPDATE_STATUS); // { data, loading, error }

    useEffect(() => {
        if (called || loading || !prod_id) return;
        fetchData();
    }, [prod_id])

    const fetchData = async () => {
        console.log(__yellow("fetchData()"))

        let resutls = await get_product({ 
                variables,
                fetchPolicy: 'network-only'
            })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.product }))
            .catch(catchApolloError)
        console.log("resutls: ", resutls)

        if (!resutls || resutls.error) {
            set_fatelError((resutls && resutls?.error?.message) || "Product not found!")
            return;
        }

        setData(resutls)
        return resutls;
    }

    const onStatusUpdate = async (values) => {
        let resutls = await updateProductStatus({ variables: { _id: data._id, status: values.status } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.updateProductStatus }))
            .catch(catchApolloError)

        if (!resutls || resutls.error) {
            message.error((resutls && resutls?.error?.message) || "Unable to update product!");
            return false;
        }

        setData(resutls)

        // set_initialValues(resutls)
        return resutls.status;
    }


    // if (status == 'loading') return <Loader loading={true} />
    if (!prod_id || fatelError) return <Alert message={fatelError || "No Product ID found!"} type='error' showIcon />
    if (loading || !data) return <Loader loading={true}>Fetching product...</Loader>
    
    const isStoreUser = !!(session?.user?.store?._id);
    // if (isStoreUser && store && store._id !== session?.user?.store?._id) return <Alert message="Unauthorized store access!" type='error' showIcon />

    const canEdit = security.verifyRole('104.4', session.user.permissions);

    return (<>
        <PageHeader 
            title={data.title}
            sub={<Space split="|">
                <div>ID: {data._id}</div>
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
                store: store_id && session.user.store,
                refresh: fetchData
            })}
        </Page>

    </>)

}
export default ProductWrapper

