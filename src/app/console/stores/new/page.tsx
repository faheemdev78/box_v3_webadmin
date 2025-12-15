'use client'

import { StoreForm } from '@/modules/store/storeForm'
import { Page } from '@/template/page'
import { PageHeader } from '@/template'
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
