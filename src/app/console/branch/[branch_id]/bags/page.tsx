'use client'

import BagsList from './components/bags_list';
import { usePageProps } from '@/components';

function Bags () {
    const { store } = usePageProps() as unknown as { store: any }
    // console.log("pageProps: ", pageProps)
    

    return (<>
        <BagsList 
            store={store}
        />
    </>)
}

export default Bags;

