// interface StoreHome_Props {
//     store: any;
//     onStatusUpdate?: Function;
// }

import { redirect } from "next/navigation";

async function StoreHome({ params, searchParams }:{
    // params: Promise<{ store_id: string }>;
    // searchParams: Promise<{ store_id: string }>;
}) {
    // const _searchParams = await searchParams;
    // console.log({ _searchParams })
    const { store_id } = await params;
    redirect(`/console/store/${store_id}/till-verification`)

    // console.log({ store_id })

  return (<>
      <h1>Redirecting...</h1>
  </>)
}

export default StoreHome;