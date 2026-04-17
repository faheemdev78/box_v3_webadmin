'use client'

import React, { useEffect, useState } from 'react'
import { StoreForm } from '@/modules/store/storeForm'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { adminRoot } from "@/configs";
import Link from 'next/link';
import { Alert, Col, Row, Space } from 'antd';
import { Loader } from '@/components';
import { useParams } from 'next/navigation';
import { __error } from '@/lib/consoleHelper';
import { checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_STORE from '@/graphql/stores/store.graphql';

// function AddStorePage(props) {
//   return (<>
//     <StoreForm {...props} store_id={props?.params?.store_id} />
//   </>)
// }


function StoreWrapper(props: any) {
  const { store_id } = useParams<{ store_id: string }>()
  // const { store_id } = props.params;

  const [fatelError, set_fatelError] = useState(null)

  const [get_store, { loading, data, called }] = useLazyQuery<any>(GET_STORE, { fetchPolicy: 'network-only' });

  const fetchZone = async () => {
    let resutls = await get_store({ variables: { _id: store_id } })
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.store }))
      .catch(err => {
        console.log(__error("Query Error: "), err)
        return { error: { message: "Query Error" } }
      })

    if (!resutls || resutls.error) {
      set_fatelError((resutls && resutls?.error?.message) || "Store not found!")
      return;
    }

    return resutls;
  }

  useEffect(() => {
    if (called || loading || !store_id) return;
    fetchZone();
  }, [store_id, called, loading])

  if (!store_id || fatelError) return <Alert title="Error" description={fatelError || "No Store ID found!"} type='error' showIcon />
  if (loading) return <Loader loading={true}>Fetching store...</Loader>
  if (!data || !data?.store?._id) return <Alert title="Error" description="Store not found!" showIcon />

  return (<>
    
    <Row gutter={[50, 50]} style={{ borderBottom: "1px solid black" }}>
      <Col><h1>{data.store.title}</h1></Col>
      <Col><Space style={{ width: "100%" }} orientation="vertical">
        {[
          { title: 'Geo Zones', href: `${adminRoot}/store/${data.store._id}/zones` },
        ].map((item, i) => {
          return <Link href={item.href} key={i}>{item.title}</Link>
        })}
      </Space></Col>
      <Col><Space style={{ width: "100%" }} orientation="vertical">
        {[
          { title: 'Products', href: `${adminRoot}/store/${data.store._id}/products` },
        ].map((item, i) => {
          return <Link href={item.href} key={i}>{item.title}</Link>
        })}
      </Space></Col>
    </Row>

    {/* <AddStorePage {...props} store={data.store} /> */}
    <StoreForm {...props} store_id={props?.params?.store_id} store={data.store} />
  </>)

}

export default StoreWrapper;
