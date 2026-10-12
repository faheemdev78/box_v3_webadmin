// interface BranchHome_Props {
//     store: any;
//     onStatusUpdate?: Function;
// }

import { redirect } from "next/navigation";

async function BranchHome({ params, searchParams }: {
    params: Promise<{ branch_id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    // const _searchParams = await searchParams;
    // console.log({ _searchParams })
    const { branch_id: store_id } = await params;
    redirect(`/console/branch/${store_id}/till-verification`)

    // console.log({ store_id })

  return (<>
      <h1>Redirecting...</h1>
  </>)
}

export default BranchHome;
