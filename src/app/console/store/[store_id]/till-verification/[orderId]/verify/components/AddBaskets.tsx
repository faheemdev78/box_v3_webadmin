import { BasketSelector } from '@/modules/orders/tillVerification/BasketSelector';

interface BasketInfo {
    _id: string;
    title: string;
    barcode: string;
    color?: string;
    status?: string;
}

export const AddBaskets = ({
    _id_store,
    category,
    currentBaskets = [],
    onBasketAction,
}: {
    _id_store: string;
    category: 'pickup' | 'dispatch';
    currentBaskets?: BasketInfo[];
    onBasketAction: (basket: BasketInfo, action: 'add' | 'remove') => Promise<void> | void;
}) => {
    const handleBasketSelectionChange = async (basket: BasketInfo, action: 'add' | 'remove') => {
        await onBasketAction(basket, action);
    };

    return (<div className='p-10 flex-1 flex w-full'><div className='w-full'>
        <BasketSelector
            async={true}
            storeId={_id_store}
            onSelectionChange={handleBasketSelectionChange}
            minRequired={1}
            category={category}
            initialSelectedBaskets={currentBaskets}
        />
    </div></div>)
}
