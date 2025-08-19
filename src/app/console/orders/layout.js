'use client'

import React from 'react'
import { adminRoot } from '@_/configs'
import { PageBar } from '@_/template'
import { Loader } from '@_/components'
import { useDispatch, useSelector } from 'react-redux';

export default function Layout({ children }) {
  const session = useSelector((state) => state.session);

  return (<>
    <div className='page-bar'>
      <PageBar 
        menuArray={[
          { title: 'Orders Dashvoard', href: `${adminRoot}/orders` },
          { title: 'Orders List', href: `${adminRoot}/orders/list` },
          { title: 'Orders on Till', href: `${adminRoot}/orders-on-till`, rolePermessions: '104.1' },
          { title: 'Ready to Dispatch', href: `${adminRoot}/ready-to-dispatch`, rolePermessions: '104.1' },
          { title: 'Dispatched', href: `${adminRoot}/dispatched`, rolePermessions: '104.1' },
          { title: 'Cart', href: `${adminRoot}/cart`, rolePermessions: '104.1' },
      ]} 
        session={session}
      />
    </div>

    {children}

  </>)
}
