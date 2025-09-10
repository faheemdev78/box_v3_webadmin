'use client'
import { usePageProps } from "@_/components";
import GeoZoneForm from "@_/modules/geo_zones/zoneForm";
// import StoreWrapper from "@_/modules/store/storeWrapper";

export default function NewZoneForm() {
    const { store } = usePageProps()

    return (<>
        <h1>New Geo Zone</h1>
        <GeoZoneForm store={store} />
    </>)
}

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<NewZoneForm store={store} />)} />)
// }
