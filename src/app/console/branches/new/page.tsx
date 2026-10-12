'use client'

import { BranchForm } from '@/modules/branch/branchForm'
import { Page } from '@/template/page'
import { PageHeader } from '@/template'
import { Card } from 'antd'

function AddBranchPage() {
  return (<>
    <PageHeader title={"Add New Branch"} />

    <Page>
      <BranchForm />
    </Page>
  </>)
}

export default AddBranchPage
