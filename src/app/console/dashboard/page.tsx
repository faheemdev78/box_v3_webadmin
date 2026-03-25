import { ConsoleHome } from './components/dashboard';


async function ConsolePage(props:any) {
    //http://192.168.18.10:3001/console/store/68755e0e245e63fc0f79a2f2/till-verification

    console.log("props: ", props)

    return <ConsoleHome />

}

export default ConsolePage;
