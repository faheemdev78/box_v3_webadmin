'use client'

import { useEffect } from 'react'
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { useRouter, useParams } from 'next/navigation';
import { DevBlock, Loader } from '@_/components';

import GET_DATA from '@_/graphql/vouchers/voucher.graphql'

function VoucherDetails() {
    const { voucher_id } = useParams<{ voucher_id: string }>()
    // const { prod_id, ...params } = useParams()

    const [getVoucher, { called, loading, data }] = useLazyQuery(GET_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called) return;
        getVoucher({ variables: { id: voucher_id } })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voucher_id])
    
    
    if (loading) return <Loader loading={true} />


    return (<div>
        <h1>NewVoucher</h1>
        <DevBlock obj={data} />
    </div>)
}

export default VoucherDetails
