'use client'

// import StoreWrapper from '@/modules/store/storeWrapper';
import { DevBlock, usePageProps } from '@_/components';

export default function BannersPage() {
    const { store } = usePageProps()

    return (<>
        <h1>Incomplete page</h1>

        <DevBlock obj={store} />
    </>)
}

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<BannersPage store={store} {...props} />)} />)
// }
