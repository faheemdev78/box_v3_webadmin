'use client'

import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { __error } from '@_/lib/consoleHelper';
import StoreWrapper from '@_/modules/store/storeWrapper';
import { VehicleForm } from '@_/modules/vehicles';
import { Card } from 'antd';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';


export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<Page>
        <PageHeader title="Add new Vehicle" />

        <Card>
            <VehicleForm {...props} store={store} />
        </Card>
    </Page>)} />)
}
