'use server';

import { Card } from "antd";
import { Page } from "@_/template";
// 'use client';

// import { Card, Col, Divider, Dropdown, Row, Space } from "antd";
// import { useDispatch, useSelector } from 'react-redux';
// import { DownOutlined, UserOutlined } from '@ant-design/icons';
// import { Button, DevBlock, PageHeading } from "@_/components";
// import { __error } from "@_/lib/consoleHelper";
// import security from "@_/lib/security.js";
// import { PageHeader, Header, Page } from "@_/template";
// import { getSessionToken } from "@_/lib/auth";


async function ConsoleHome(props) {
    // const session = await getSessionToken()
    // const [session, setSession] = useState(null);
    // const session = useSelector((state) => state.session);

    // useEffect(() => {
    //     setSession(getSessionToken())
    // }, []);
    

    // if (!session){
    //     if(process.env.NODE_ENV == 'development') return <p>No session found</p>
    //     return null;
    // }

    // const showSalesChart = security.verifyRole("1001.1", session.user.permissions);

    return (<>
        <p>Page Dashbaord</p>

        <Page>
            <Card>
                <div>Sales Chart</div>
                <div>Delivery Chart</div>
                <div>Orders Chart by Zone</div>
                <div>Orders Status Chart</div>
                <div>New customers bar chart in 30 days</div>
                <div>Orders bar chart in 30 days</div>
                <div>Delivery chart by drivers</div>
            </Card>
        </Page>


    </>)

    // return (<>
    //     <PageHeader title="Dashboard"
    //         onSearch={console.log}
    //         searchFields={[
    //             { label: "Field 1", value: "val-1" },
    //             { label: "Field 2", value: "val-2" },
    //             { label: "Field 3", value: "val-3" },
    //         ]}
    //     >
    //         <Dropdown menu={{
    //             items: [
    //                 { label: '1st menu item', key: '1', icon: <UserOutlined /> },
    //                 { label: '2st menu item', key: '2', icon: <UserOutlined />, danger: true },
    //                 { label: '3st menu item', key: '3', icon: <UserOutlined />, disabled: true },
    //                 { label: '4st menu item', key: '4', icon: <UserOutlined /> },
    //             ],
    //             onClick: console.log,
    //         }}>
    //             <Button><Space>Actions <DownOutlined /></Space></Button>
    //         </Dropdown>
    //         <Button onClick={console.log} color="orange">Add</Button>
    //     </PageHeader>

    //     <Page>

    //         <Card>
    //             <div>Sales Chart</div>
    //             <div>Delivery Chart</div>
    //             <div>Orders Chart by Zone</div>
    //             <div>Orders Status Chart</div>
    //             <div>New customers bar chart in 30 days</div>
    //             <div>Orders bar chart in 30 days</div>
    //             <div>Delivery chart by drivers</div>
    //         </Card>

    //     </Page>
    // </>)

}

export default ConsoleHome;
