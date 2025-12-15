'use client'
import { usePageProps } from "@/components";
import GeoZoneForm from "@/modules/geo_zones/zoneForm";

function NewZoneForm() {
    const { store } = usePageProps() as unknown as { store: any }

    return (<>
        <h1>New Geo Zone</h1>
        <GeoZoneForm store={store} zone_id={undefined as any} />
    </>)
}


export default NewZoneForm

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<NewZoneForm store={store} />)} />)
// }
