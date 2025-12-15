'use client'

import BasketsList from './components/baskets_list';
import { usePageProps } from '@/components';

function Baskets () {
    const { store } = usePageProps() as unknown as { store: any }
    // console.log("pageProps: ", pageProps)
    

    return (<>
        <BasketsList 
            store={store}
            // onEditRecord={(item) => set_showForm(item)} 
            // onAddClick={() => set_showForm(true)}
        />

        {/* <BasketForm onClose={() => set_showForm(false)} open={showForm !== false} store={store} initialValues={(showForm && showForm._id) ? showForm : undefined} /> */}
    </>)
}

export default Baskets;

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<Baskets store={store} {...props} />)} />)
// }

// export default Baskets;
