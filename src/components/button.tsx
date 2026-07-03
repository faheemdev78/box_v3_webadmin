'use client'

import React, { useState, useCallback, ReactNode } from 'react'
import { Alert, Button as AntButton, Dropdown, Popconfirm, Tooltip, ConfigProvider, ButtonProps, TooltipProps } from "antd";
// import { useResponsive } from 'antd-style';
import styles from './Button.module.scss'
import { useRouter } from "next/navigation";
import { DeleteOutlined, MenuOutlined, HddOutlined, UngroupOutlined, LeftOutlined } from '@ant-design/icons';
import _, { throttle } from 'lodash';
import { Icon } from './icon';
import { __error } from '@/lib/consoleHelper';


const CLICK_TIMEOUT = 500; // 2000 = 2 seconds

interface BtnProps extends ButtonProps {
    // onClick: Function,
    tooltip?: string | object | React.ReactNode,
    // color?: string | undefined,
    children?: any,
    icon?: any,
    // size?: string,
}
export const Button = ({ onClick, tooltip, ...props }: BtnProps) => {
    // const { xxl } = useResponsive();

    let class_name = styles.custom_bt
    // if (props.color) class_name.push(styles[`bt_${props.color}`])
        // class_name = [styles[`bt_${props.color}`], styles.custom_bt]
    
    let throttleHandler = onClick ? throttle(onClick, CLICK_TIMEOUT, {
        leading: true,  // Fire on the first click.
        trailing: false, // Do not fire again after the cooldown.
    }) : undefined
    const throttledHandlePress = useCallback((...args: any[]) => {
        if (throttleHandler){
            (throttleHandler as any)(...args)
        }
    }, [throttleHandler])

    // const throttledHandlePress = useCallback(
    //     onClick ? throttle(onClick, CLICK_TIMEOUT, {
    //         leading: true,  // Fire on the first click.
    //         trailing: false, // Do not fire again after the cooldown.
    //     }) : undefined,
    //     [onClick] // Include onClick in dependencies
    // );

    if (tooltip) {
        const _tooltip: any = (_.isString(tooltip) || React.isValidElement(tooltip)) ? { title: tooltip } : tooltip;
        return <Tooltip {..._tooltip}><AntButton onClick={throttledHandlePress} variant="solid" {...props} className={class_name} /></Tooltip>
    }
    return <AntButton onClick={throttledHandlePress} variant="solid" {...props} className={class_name} />;
}

export const BackButton = ({ onClick, tooltip,  ...props }: { onClick?: () => void; tooltip?: React.ReactNode; [key:string]: any }) => {
    const router = useRouter();
    // if (props.href) return <Button {...props} icon={<LeftOutlined />}>{props.children || 'Back'}</Button>

    const _onClick = () => onClick ? onClick() : router.back();

    let throttleHandler = _onClick && throttle(_onClick, CLICK_TIMEOUT, {
        leading: true,  // Fire on the first click.
        trailing: false, // Do not fire again after the cooldown.
    })
    const throttledHandlePress = useCallback((...args: any[]) => {
        if (throttleHandler) {
            (throttleHandler as any)(...args)
        }
    }, [throttleHandler])

    // const throttledHandlePress = useCallback(
    //     throttle(_onClick, CLICK_TIMEOUT, {
    //         leading: true,  // Fire on the first click.
    //         trailing: false, // Do not fire again after the cooldown.
    //     }),
    //     [onClick, router] // Include dependencies
    // );



    let Wrapper = ({ children }: { children:ReactNode }) => (tooltip) ? <Tooltip title={tooltip}>{children}</Tooltip> : <>{children}</>;

    return <Wrapper><Button {...props} onClick={throttledHandlePress} icon={<LeftOutlined />}>{props.children}</Button></Wrapper>
}
// BackButton.propTypes = {
//     onClick: PropTypes.func,
//     tooltip: PropTypes.string,
// }

export const DeleteButton = (props:any) => {
    const [busy, setBusy] = useState(false);

    const onClick = async () => {
        setBusy(true);
        await props.onClick()
        setBusy(false);
    }

    let throttleHandler = props.onClick && throttle(onClick, CLICK_TIMEOUT, {
        leading: true,  // Fire on the first click.
        trailing: false, // Do not fire again after the cooldown.
    })
    const throttledHandlePress = useCallback(() => {
        if (props.onClick) {
            throttleHandler()
        }
    }, [props.onClick, throttleHandler])

    // const throttledHandlePress = useCallback(
    //     throttle(onClick, CLICK_TIMEOUT, {
    //         leading: true,  // Fire on the first click.
    //         trailing: false, // Do not fire again after the cooldown.
    //     }),
    //     [props.onClick, throttle] // Include props.onClick in dependencies
    // );

    let Wrapper = ({ children }: { children: ReactNode }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;

    if (props.skipConfirm) return <Wrapper><Button disabled={props.disabled} onClick={throttledHandlePress} loading={props.loading || busy} icon={<DeleteOutlined />} danger type="primary" size={props.size} shape={props.shape || "circle"} /></Wrapper>

    let _children = <Button icon={<DeleteOutlined />} disabled={props.disabled} loading={props.loading || busy} color={props.color || "red"} type="primary" size={props.size} shape={props.shape || "circle"} block={!!props.block} />;
    if (props.children && _.isString(props.children)) _children = <Button disabled={props.disabled} loading={props.loading || busy} color={props.color || "red"} type="primary" size={props.size} block={!!props.block}>{props.children}</Button>;
    else if (props.children) _children = props.children;

    
    return <Wrapper><Popconfirm
        disabled={props.disabled}
        title={props?.title || "Confirm deletion"}
        description={props?.description || "Are you sure to delete this record?"}
        onConfirm={props.onConfirm || throttledHandlePress}
        onCancel={props.onCancel}
        okText={props?.okText || "Yes"}
        cancelText={props?.cancelText || "No"}
    >
        {/* {props.children || <Button icon={<DeleteOutlined />} disabled={props.disabled} loading={props.loading || busy} color={props.color || "red"} type="primary" size={props.size} shape={props.shape || "circle"} children={props.label} />} */}
        {_children}
    </Popconfirm></Wrapper>
}

export const ArchiveButton = (props:any) => {
    const [busy, setBusy] = useState(false);

    const onClick = async () => {
        setBusy(true);
        await props.onClick()
        setBusy(false);
    }

    let throttleHandler = props.onClick && throttle(onClick, CLICK_TIMEOUT, {
        leading: true,  // Fire on the first click.
        trailing: false, // Do not fire again after the cooldown.
    })
    const throttledHandlePress = useCallback(() => {
        if (props.onClick) {
            throttleHandler()
        }
    }, [props.onClick, throttleHandler])



    // const throttledHandlePress = useCallback(
    //     throttle(onClick, CLICK_TIMEOUT, {
    //         leading: true,  // Fire on the first click.
    //         trailing: false, // Do not fire again after the cooldown.
    //     }),
    //     [props.onClick] // Include props.onClick in dependencies
    // );

    let Wrapper = ({ children }: { children: ReactNode }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;

    if (props.skipConfirm) return <Wrapper><Button onClick={throttledHandlePress} loading={props.loading || busy} icon={<HddOutlined />} danger type="primary" size={props.size} shape={props.shape || "circle"} /></Wrapper>;
    
    return <Wrapper><Popconfirm
        title={props?.title || "Confirm action"}
        description={props?.description || "Are you sure to archive this record?"}
        onConfirm={props.onConfirm || throttledHandlePress}
        onCancel={props.onCancel}
        okText={props?.okText || "Yes"}
        cancelText={props?.cancelText || "No"}
    >
        {props.children || <Button icon={<HddOutlined />} loading={props.loading || busy} color="blue" type="primary" size={props.size} shape={props.shape || "circle"} />}
    </Popconfirm></Wrapper>
}

export const UnArchiveButton = (props: any) => {
    const [busy, setBusy] = useState(false);

    const onClick = async () => {
        setBusy(true);
        await props.onClick()
        setBusy(false);
    }

    // let throttleHandler = props.onClick && throttle(onClick, CLICK_TIMEOUT, {
    //     leading: true,  // Fire on the first click.
    //     trailing: false, // Do not fire again after the cooldown.
    // })
    // const throttledHandlePress = useCallback(() => {
    //     if (props.onClick) {
    //         throttleHandler()
    //     }
    // }, [props.onClick, throttleHandler])


    // const throttledHandlePress = useCallback(
    //     throttle(onClick, CLICK_TIMEOUT, {
    //         leading: true,  // Fire on the first click.
    //         trailing: false, // Do not fire again after the cooldown.
    //     }),
    //     [props.onClick] // Include props.onClick in dependencies
    // );

    let Wrapper = ({ children }: { children: ReactNode }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;

    if (props.skipConfirm) return <Wrapper><Button onClick={onClick} loading={props.loading || busy} icon={<UngroupOutlined />} danger type="primary" size={props.size} shape={props.shape || "circle"} /></Wrapper>;
    
    return <Wrapper><Popconfirm
        title={props?.title || "Confirm action"}
        description={props?.description || "Are you sure to archive this record?"}
        onConfirm={props.onConfirm || onClick}
        onCancel={props.onCancel}
        okText={props?.okText || "Yes"}
        cancelText={props?.cancelText || "No"}
    >
        {props.children || <Button icon={<UngroupOutlined />} loading={props.loading || busy} color="blue" type="primary" size={props.size} shape={props.shape || "circle"} />}
    </Popconfirm></Wrapper>
}

interface IconBtnProps extends ButtonProps {
    tooltip?: string | object,
    icon?: any,
}
export const IconButton = ({ icon, ...props }: IconBtnProps) => {
    const _icon = React.isValidElement(icon) ? icon : icon ? <Icon icon={icon} /> : undefined;

    // let throttleHandler = onClick && throttle(onClick, CLICK_TIMEOUT, {
    //     leading: true,  // Fire on the first click.
    //     trailing: false, // Do not fire again after the cooldown.
    // })
    // const throttledHandlePress = useCallback(() => {
    //     if (onClick) {
    //         throttleHandler()
    //     }
    // }, [onClick, throttleHandler])


    // const throttledHandlePress = useCallback(
    //     throttle(onClick, CLICK_TIMEOUT, {
    //         leading: true,  // Fire on the first click.
    //         trailing: false, // Do not fire again after the cooldown.
    //     }),
    //     [onClick] // Include onClick in dependencies
    // );

    if (props.tooltip) return <Tooltip title={props.tooltip as React.ReactNode}><Button 
        // onClick={throttledHandlePress} 
        {...props} icon={_icon} /></Tooltip>;
    return <Button 
        // onClick={throttledHandlePress} 
    {...props} icon={_icon} />

    // let Wrapper = ({ children }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;
    // return <Wrapper><Button {...props} icon={_icon} /></Wrapper>
}

export const MenuButton = (props: any) => {

    // let throttleHandler = props.onClick && throttle(onClick, CLICK_TIMEOUT, {
    //     leading: true,  // Fire on the first click.
    //     trailing: false, // Do not fire again after the cooldown.
    // })
    // const throttledHandlePress = useCallback(() => {
    //     if (props.onClick) {
    //         throttleHandler()
    //     }
    // }, [props.onClick, throttleHandler])


    // const throttledHandlePress = useCallback(
    //     throttle(onClick, CLICK_TIMEOUT, {
    //         leading: true,  // Fire on the first click.
    //         trailing: false, // Do not fire again after the cooldown.
    //     }),
    //     [onClick] // Include onClick in dependencies
    // );

    return <Button {...props}><MenuOutlined /></Button>
}

export const ActionButton = ({ style, size, items, disabled, placement, color }: { style:any, size:string | number, items:any, disabled:boolean, placement?: import('antd').DropdownProps['placement'], color:string }) => {
    // let _items = items ? items.map((item, i) => ({ ...item, key:i })) : []

    let _items = items ? items.map(({ onClick, label, ...item }: { onClick: () => void, label: string }, i: number) => {
        // Create throttled handler directly without useCallback inside map
        const throttledHandlePress = throttle(onClick as () => void, CLICK_TIMEOUT, {
            leading: true,  // Fire on the first click.
            trailing: false, // Do not fire again after the cooldown.
        });
        return ({
            key: (i + 1),
            label: <a href="javascript:void(0)" rel="noopener noreferrer" onClick={throttledHandlePress}>{label}</a>
        })
    }) : [];

    // const items = [
    //     {
    //         key: '1',
    //         label: (
    //             <a rel="noopener noreferrer" href="#">Export this schedule to CSV</a>
    //         ),
    //     },
    // ];
    return <Dropdown menu={{ items: _items }} arrow disabled={disabled} placement={placement}>
        <MenuButton size={size} color={color} shape="round" style={style} />
    </Dropdown>
    // return <Button {...props}>{props.children || <MenuOutlined />}</Button>
}
