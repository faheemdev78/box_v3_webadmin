'use client'

// import { useState } from 'react';
import StoreWrapper from '@/modules/store/storeWrapper';
import BasketsList from './components/baskets_list';
// import BasketForm from './components/basket_form';

function Baskets ({ store }) {
    // const [showForm, set_showForm] = useState(false);

    return (<>
        <BasketsList 
            store={store}
            // onEditRecord={(item) => set_showForm(item)} 
            // onAddClick={() => set_showForm(true)}
        />

        {/* <BasketForm onClose={() => set_showForm(false)} open={showForm !== false} store={store} initialValues={(showForm && showForm._id) ? showForm : undefined} /> */}
    </>)
}

export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<Baskets store={store} {...props} />)} />)
}

// export default Baskets;
