'use client'
import GeoZoneForm from "@_/modules/geo_zones/zoneForm";
import StoreWrapper from "@_/modules/store/storeWrapper";



function NewZoneForm({ store }) {
    return (<>
        <h1>New Geo Zone</h1>
        <GeoZoneForm store_id={store._id} />
    </>)
}

export default function Wrapper(props){
    return (<StoreWrapper {...props} render={({ store }) => (<NewZoneForm store={store} />)} />)
}
