'use client'

import { __error } from '@/lib/consoleHelper';
import { VehicleForm } from '@/modules/vehicles';
import { Card } from 'antd';
import { Page } from '@/template/page';
import { PageHeader } from '@/template';
import { usePageProps } from '@/components';


function Wrapper(props:any){
    const { store } = usePageProps() as unknown as { store: any }

    return (<>
        <Page>
            <PageHeader title="Add new Vehicle" />
            <Card>
                <VehicleForm {...props} store={store} />
            </Card>
        </Page>
    </>)

//     return (<StoreWrapper {...props} render={({ store }) => (<Page>
//         <PageHeader title="Add new Vehicle" />

//         <Card>
//             <VehicleForm {...props} store={store} />
//         </Card>
//     </Page>)} />)
}

export default Wrapper;
