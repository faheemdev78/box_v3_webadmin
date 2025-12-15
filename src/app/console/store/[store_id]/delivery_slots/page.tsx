'use client'
import { DeliverySlotManager } from '@/modules/delivery_slot';
import { usePageProps } from '@/components';

function Wrapper(){
    const { store } = usePageProps() as unknown as { store: any }

    return <DeliverySlotManager store={store} zone={null as any} />

    // return (<StoreWrapper {...props} render={({ store }) => (<DeliverySlotManager store={store} />)} />)
}

export default Wrapper;
