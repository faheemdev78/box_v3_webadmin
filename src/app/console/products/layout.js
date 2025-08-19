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
          { title: 'Catelogue', href: `${adminRoot}/products/list` },
          { title: 'Out of Stock', href: `${adminRoot}/products/list/out_of_stock` },
          { title: 'Without Images', href: `${adminRoot}/products/list/without_images` },
          // { title: 'Product Fields', href: `${adminRoot}/products/fields` },
          // { title: 'Categories', href: `${adminRoot}/products/categories` },
          // { title: 'Attributes', href: `${adminRoot}/products/attributes` },
          // { title: 'Types', href: `${adminRoot}/products/types` },
        ]} 
        session={session}
      />
    </div>

    {/* <HeaderMenu menuArray={[
        { title: 'Catelogue', href: `${adminRoot}/products` },
        { title: 'Out of Stock', href: `${adminRoot}/products/out_of_stock` },
        { title: 'Without Images', href: `${adminRoot}/products/without_images` },
        { title: 'Product Fields', href: `${adminRoot}/products/fields` },
        // { title: 'Categories', href: `${adminRoot}/products/categories` },
        // { title: 'Attributes', href: `${adminRoot}/products/attributes` },
        // { title: 'Types', href: `${adminRoot}/products/types` },
    ]} /> */}


      {children}

  </>)
}
