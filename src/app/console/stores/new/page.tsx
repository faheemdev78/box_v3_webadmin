'use client'

import React from 'react'
import { StoreForm } from '@/modules/store/storeForm'
import { Page } from '@_/template/page'
import { PageHeader } from '@_/template'
import { Card } from 'antd'

function AddStorePage() {
  return (<>
    <PageHeader title={"Add New Store"} />

    <Page>
      <Card>
        <StoreForm />
      </Card>
    </Page>
  </>)
}

export default AddStorePage
