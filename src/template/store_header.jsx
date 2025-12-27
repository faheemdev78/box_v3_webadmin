'use client'

import { useState } from "react"
import { Alert, Col, Popover, Row, Space } from "antd"
import { Image } from '@/components'
import Link from "next/link"
import { Avatar, Icon, IconButton, Loader, SearchBar, Drawer, Button } from "@/components"
import { adminRoot, defaultDateTimeFormat } from "@/configs"
import { utcToDate } from "@/lib/utill"
import { LinkComp, TopBar } from "./menuBar"
import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter } from "next/navigation"
import { store_topMenuArray } from './menus';


function CommonSearchBar({ onFocus, onSearch=console.log }){
    return (<SearchBar onFocus={onFocus} style={{ margin: "0px", maxWidth: "200px" }} onSearch={onSearch} />)
}



export function StoreHeader({ baseUrl, store }) {
    const [showGlobalResults, set_showGlobalResults] = useState(false)
    const [showDrawer, set_showDrawer] = useState(false)
    const session = useSelector((state) => state.session);
    const router = useRouter()

    const pathname = usePathname();
    if (pathname === '/login' || !session || !session.token) return null; // <Alert title="Error" description="not logged in" type="error" showIcon />;

    const PopContents = () => {
        return (<div style={{ width: "300px", border: "0px solid #000" }}><Space orientation='vertical' separator={<div style={{ borderBottom: "1px solid #EEE" }} />} style={{ width: "100%" }}>
            <div style={{ padding: "20px" }}>
                <Row gutter={[20]}>
                    <Col><Space orientation="vertical">
                        <Avatar size={50}>{String(session.user.name).charAt(0)}</Avatar>
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
                <Space orientation='vertical' style={{ width: "100%" }} size={0}>
                    <Link href="#">Report a Problem</Link>
                    <a href="/logout">Sign Out</a>
                </Space>
            </div>

        </Space></div>)
    }

    return (<>
        <div className='top-bar'>
            <Row align="middle" gutter={[20]} className='nowrap'>
                <Col>
                    <Link href={adminRoot}><Image src="/box-logo-green.png" priority="high" alt="BOX" width={70} height={22} /></Link>
                    <div style={{ fontSize: "10px" }}>{store && store.title}</div>
                </Col>
                <Col><TopBar menuArray={store_topMenuArray({ baseUrl })} session={session} /></Col>
                <Col flex="auto" align="center"><CommonSearchBar onFocus={() => set_showGlobalResults(true)} /></Col>
                <Col align="right" className='menu-bar'>
                    <Space separator={<div style={{ width: "1px", height: "30px", backgroundColor: "#000" }} />} size={0}>
                        <div style={{ fontSize: "24px" }}><Space size={0}>
                            <div className='menu-bar-item' style={{ padding: "10px 15px" }} onClick={() => set_showDrawer('alerts')}><Icon icon="bell" color="white" /></div>
                            <div className='menu-bar-item' style={{ padding: "10px 15px" }} onClick={() => set_showDrawer('messages')}><Icon icon="message" color="white" /></div>
                        </Space></div>
                        <Popover title={false} trigger="hover"
                            styles={{ body: { padding: "0px" } }}
                            content={PopContents()}>
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
        </div>

        <Drawer open={showDrawer == 'alerts'} title="Alerts" onClose={() => set_showDrawer(false)}>
            {showDrawer == 'alerts' && <></>}
        </Drawer>

        <Drawer open={showDrawer == 'messages'} title="Messages" onClose={() => set_showDrawer(false)}>
            {showDrawer == 'messages' && <></>}
        </Drawer>


    </>)
}
