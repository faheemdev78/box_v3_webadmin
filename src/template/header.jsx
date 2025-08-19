'use client'

import { useState } from "react"
import { Alert, Col, Popover, Row, Space } from "antd"
import { Image } from '@_/components'
import Link from "next/link"
// import { signOut, useSession } from "next-auth/react"
import { Avatar, Icon, IconButton, Loader, SearchBar, Drawer, Button } from "@_/components"
import { adminRoot, defaultDateTimeFormat } from "@_/configs"
import { utcToDate } from "@_/lib/utill"
import { LinkComp, TopBar } from "./menuBar"
import { useDispatch, useSelector } from 'react-redux';
import { clearSessionToken, getSessionToken } from "@_/lib/auth";
import { cleanStore } from '@_/rStore';
import { sleep } from "@_/lib";
import { usePathname, useRouter } from "next/navigation"
import { topMenuArray } from './menus';


function CommonSearchBar({ onFocus, onSearch=console.log }){
    return (<SearchBar onFocus={onFocus} style={{ margin: "0px", maxWidth: "200px" }} onSearch={onSearch} />)
}



export function Header({  }) {
    const [showGlobalResults, set_showGlobalResults] = useState(false)
    const [showDrawer, set_showDrawer] = useState(false)
    const session = useSelector((state) => state.session);
    const router = useRouter()

    const pathname = usePathname();
    if (pathname === '/login' || !session || !session.token) return null; // <Alert message="not logged in" type="error" showIcon />;

    // async function logout(args) {
    //     let callbackUrl = (args && args.callbackUrl) || '/';
    //     clearSessionToken();
    //     cleanStore();
    //     await sleep(100)
    //     router.replace(callbackUrl)
    //     // window.location = callbackUrl; // || "/"; // '/'
    // }

    const PopContents = () => {
        return (<div style={{ width: "300px", border: "0px solid #000" }}><Space direction='vertical' split={<div style={{ borderBottom: "1px solid #EEE" }} />} style={{ width: "100%" }}>
            <div style={{ padding: "20px" }}>
                <Row gutter={[20]}>
                    <Col><Space direction="vertical">
                        <Avatar size={50}>{String(session.user.name).charAt(0)}</Avatar>
                        {/* <Button color="red" size="small" onClick={() => logout()}>Log out</Button> */}
                        <Button color="red" size="small" onClick={() => router.replace("/logout")}>Log out</Button>
                    </Space></Col>
                    <Col>
                        <div style={{ lineHeight: "16px", marginBottom: "10px" }}>
                            <h4>{session.user.name}</h4>
                            <div>{session.user.email}</div>
                        </div>
                        <div><Link href={`${adminRoot}/profile`}>Profile & Preferences</Link></div>
                        <div style={{ color:"#999" }}>{utcToDate().format(defaultDateTimeFormat)}</div>
                    </Col>
                </Row>
            </div>

            <div style={{ padding: "20px" }}>
                <h4>Theme</h4>
                <Space>
                    {/* <Icon icon="circle" /> */}
                    <div style={{ borderRadius:"50%", width:"30px", height:"30px", backgroundColor:"red" }} />
                </Space>
            </div>

            <div style={{ padding: "0px" }}>
                <Space direction='vertical' style={{ width: "100%" }} size={0}>
                    <LinkComp href="#">Report a Problem</LinkComp>
                    <LinkComp onClick={() => logout({ callbackUrl: "/login" })}>Sign Out</LinkComp>
                </Space>
            </div>

        </Space></div>)
    }

    return (<>
        <div className='top-bar'>
            <Row align="middle" gutter={[20]} className='nowrap'>
                <Col><Link href={adminRoot}><Image src="/box-logo-green.png" priority="high" alt="BOX" width={100} height={32} /></Link></Col>
                <Col><TopBar menuArray={topMenuArray} session={session} /></Col>
                <Col flex="auto" align="center"><CommonSearchBar onFocus={() => set_showGlobalResults(true)} /></Col>
                <Col align="right" className='menu-bar'>
                    <Space split={<div style={{ width: "1px", height: "30px", backgroundColor: "#000" }} />} size={0}>
                        <div style={{ fontSize: "24px" }}><Space size={0}>
                            <div className='menu-bar-item' style={{ padding: "10px 15px" }} onClick={() => set_showDrawer('alerts')}><Icon icon="bell" color="white" /></div>
                            <div className='menu-bar-item' style={{ padding: "10px 15px" }} onClick={() => set_showDrawer('messages')}><Icon icon="message" color="white" /></div>
                        </Space></div>
                        <Popover title={false} trigger="hover"
                            styles={{ body: { padding: "0px" } }}
                            content={<PopContents />}>
                            <Space className='menu-bar-item' style={{ display: "inline-flex" }}>
                                <Avatar size={30}>{String(session.user.name).charAt(0).toUpperCase()}</Avatar>
                                <div style={{ maxWidth: "50px" }} className='ellipsis'>{session.user.name}</div>
                            </Space>
                        </Popover>
                    </Space>
                </Col>
            </Row>
        </div>

        <div className={`global-search-results ${showGlobalResults ? 'visible' : ''}`}>
            <Row>
                <Col flex="auto"><h2>Results</h2></Col>
                <Col><IconButton icon="close" onClick={() => set_showGlobalResults(false)} /></Col>
            </Row>
            <p>0 Search result(s) found</p>

            {/* <DummyTable /> */}
        </div>

        <Drawer open={showDrawer == 'alerts'} title="Alerts" onClose={() => set_showDrawer(false)}>
            {showDrawer == 'alerts' && <></>}
        </Drawer>

        <Drawer open={showDrawer == 'messages'} title="Messages" onClose={() => set_showDrawer(false)}>
            {showDrawer == 'messages' && <></>}
        </Drawer>


    </>)
}
