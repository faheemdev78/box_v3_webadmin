'use client'

import React from 'react'
import { ConfigProvider, Popover, Space } from 'antd'
import Link from 'next/link'
import { filterPermissions } from '@_/lib/security'
import { Icon } from '@_/components';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@_/rStore/hooks'
import { getSession } from '@_/rStore/slices/sessionSlice'

export function LinkComp({ children, href = "#", onClick, className }: {
    children: React.ReactNode;
    href: string | "#";
    onClick: Function;
    className: string;
}) {
    return <Link className={`block-menu-item ${className || ""}`} href={href} onClick={onClick}>{children}</Link>
}


export function TopBar({ menuArray, session }: {
    menuArray: object[];
    session: object;
}) {
    const pathname = usePathname()
    const matchUrl = (href) => pathname.startsWith(href);

    return (<div className='menu-bar'>
        <Space size={0}>
            {filterPermissions(menuArray, session).map((item, i) => {
                if (item.children && item.children.length > 0) {
                    return (<Popover
                        color="#2D3E51"
                        placement="bottom"
                        // classNames={{ body: "menu-bar-item-children" }}
                        styles={{ body: { padding: 0, margin: 0, border: "0px solid red" } }}
                        title={false}
                        content={filterPermissions(item.children, session)?.map((ch, ii) => (<LinkComp className={`${matchUrl(ch.href) ? 'active' : ''}`} href={ch.href || '#'} key={ii}>{ch.title}</LinkComp>))}
                        arrow={true}
                        key={i}>
                        <Link className={`${matchUrl(item.href) ? 'active' : ''}`} href={item.href || '#'} key={i}>
                            <div style={{ display:"flex", gap:'3px' }} className='nowrap'>{item.title} <Icon className="more-icon" icon="angle-down" /></div>
                        </Link>
                    </Popover>)
                }

                if (item.children && item.children.length < 1 && !item.href) return null;

                return <Link className={`${matchUrl(item.href) ? 'active' : ''}`} href={item.href || '#'} key={i}>{item.title}</Link>
            })}
        </Space>
    </div>)
}


export function PageBar({ menuArray, _session }: {
    menuArray: object[];
    _session?: object;
}) {
    const pathname = usePathname()
    const matchUrl = (href) => pathname.startsWith(href);
    const session = useAppSelector(getSession);


    return (<div className='menu-bar'>
      <Space size={0} split="|">
            {filterPermissions(menuArray, session)?.map((item, i) => {

                if (item.children && filterPermissions(item.children, session).length > 0) {
                    // return (<ConfigProvider
                    //     theme={{
                    //         components: {
                    //             Popover: {
                    //                 colorBgElevated: "#red",
                    //             },
                    //         },
                    //     }}
                    // >
                    //     <Popover
                    //         placement="bottom"
                    //         classNames={{ content: "menu-bar-item-children" }}
                    //         styles={{ body: { padding: 0, margin: 0, border: "0px solid red" } }}
                    //         title={false}
                    //         content={filterPermissions(item.children, session)?.map((ch, ii) => (<LinkComp href={ch.href} key={ii}>{ch.title}</LinkComp>))}
                    //         arrow={true}
                    //         key={i}>
                    //         <Link href={item.href} key={i}>{item.title} <Icon className="more-icon" icon="angle-down" /></Link>
                    //     </Popover>
                    // </ConfigProvider>)

                    return (<Popover
                        placement="bottom"
                        classNames={{ body: "menu-bar-dd-children" }}
                        styles={{ body: { padding: 0, margin: 0, border: "0px solid red" } }}
                        title={false}
                        content={filterPermissions(item.children, session)?.map((ch, ii) => (<LinkComp className={`${matchUrl(ch.href) ? 'active' : ''}`} href={ch.href} key={ii}>{ch.title}</LinkComp>))}
                        arrow={true}
                        key={i}>
                        <Link className={`${matchUrl(item.href) ? 'active' : ''}`} href={item.href} key={i}>{item.title} <Icon className="more-icon" icon="angle-down" /></Link>
                    </Popover>)
                }

                return <Link className={`${matchUrl(item.href) ? 'active' : ''}`} href={item.href} key={i}>{item.title}</Link>
            })}
        </Space>
    </div>)
}
