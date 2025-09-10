'use client'

import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { __error } from '@_/lib/consoleHelper';
// import StoreWrapper from '@_/modules/store/storeWrapper';
import { VehicleForm } from '@_/modules/vehicles';
import { Card } from 'antd';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';
import { usePageProps } from '@_/components';


export default function Wrapper(props){
    const { store } = usePageProps()

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
