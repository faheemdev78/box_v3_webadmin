'use client'

import React from 'react';
import { Alert, Space } from 'antd';
import { useQuery } from '@apollo/client/react';
import { Button, Icon, IconButton, Loader } from '@/components';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import type { RootState } from '@/rStore';

import GET_BAGS from '@/graphql/bags/bags.graphql';

interface Bags {
    _id: string;
    barcode: string;
    size: string;
    qty: number;
    price: number;
    // status: string;
}

function Addbags({
    currentBags = [],
    onBagAction,
}: {
    currentBags?: Array<{ _id: string; qty: number }>;
    onBagAction: (bag: Bags, action: 'add' | 'remove') => Promise<void>;
}){
    const session = useAppSelector((state: RootState) => state.session);
    const settings = useAppSelector(getSettings);

    const { data, loading, error } = useQuery<any>(GET_BAGS, {
        variables: { filter: JSON.stringify({ status:'active' }) },
    });

    if (loading) return <Loader loading={true} />
    if (error) return <Alert title="Error" description={error.message} showIcon />

    return (<div className='p-10 flex-1 flex w-full'><div className='w-full'>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-[10px]">
            {data?.bags?.map((bag: Bags, index:number) => (<div key={index} className="flex flex-col w-full items-center justify-center">
                {(() => {
                    const selectedQty = currentBags.find((currentBag) => currentBag._id === bag._id)?.qty || 0;
                    return (
                <div className='flex flex-col items-center justify-center overflow-hidden w-full h-[200px] bg-white border border-gray-200 rounded-md p-5'>
                    {/* <div className='h-[100px] w-[70px] bg-white-300 text-center text-blue-300'><Icon icon="shopping-bag" size="4x" /></div> */}
                    <div className='text-center text-blue-300'><Icon icon="shopping-bag" size="6x" /></div>
                    {/* <div>{index}x{index} {bag.size}</div> */}
                    <div>{bag.size}</div>
                    <div className='text-2xl font-bold'>{settings.currency} {bag.price}</div>
                    <div className='text-sm'>Selected: {selectedQty}</div>
                    <Space>
                        <IconButton onClick={() => onBagAction(bag, 'remove')} disabled={selectedQty < 1} icon="minus" />
                        <IconButton color='green' onClick={() => onBagAction(bag, 'add')} icon="plus" />
                        {/* <Button onClick={() => onBagAction(bag, 'remove')} disabled={selectedQty < 1}>-</Button>
                        <Button color='green' onClick={() => onBagAction(bag, 'add')}>Add</Button> */}
                    </Space>
                </div>
                    )
                })()}
            </div>))}
        </div>
    </div></div>)


}

export default Addbags;
