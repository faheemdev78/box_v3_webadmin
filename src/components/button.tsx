'use client'

import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types';
import { Alert, Button as AntButton, Dropdown, Popconfirm, Tooltip, ConfigProvider } from "antd";
// import { useResponsive } from 'antd-style';
import styles from './Button.module.scss'
import { useRouter } from "next/navigation";
import { DeleteOutlined, MenuOutlined, HddOutlined, UngroupOutlined, LeftOutlined } from '@ant-design/icons';
import _, { throttle } from 'lodash';
import { Icon } from './icon';
import { __error } from '@_/lib/consoleHelper';


export const Button = ({ onClick, tooltip, ...props }: { onClick: Function, tooltip: string }) => {
    // const { xxl } = useResponsive();

    let class_name = [styles.custom_bt]
    // if (props.color) class_name.push(styles[`bt_${props.color}`])
        // class_name = [styles[`bt_${props.color}`], styles.custom_bt]

    var throttledHandlePress;
    if (onClick){
        throttledHandlePress = useCallback(
            throttle(onClick, 2000, {
                leading: true,  // Fire on the first click.
                trailing: false, // Do not fire again after the cooldown.
            }),
            [] // Empty dependency array means the throttled function is created only once.
        );
    }

    if (tooltip) return <Tooltip title={tooltip}><AntButton onClick={throttledHandlePress} variant="solid" {...props} className={class_name} /></Tooltip>
    return <AntButton onClick={onClick && throttledHandlePress} variant="solid" {...props} className={class_name} />;
}

export const BackButton = ({ onClick, tooltip,  ...props }) => {
    const router = useRouter();
    // if (props.href) return <Button {...props} icon={<LeftOutlined />}>{props.children || 'Back'}</Button>
    
    const _onClick = () => onClick ? onClick() : router.back();

    const throttledHandlePress = useCallback(
        throttle(_onClick, 2000, {
            leading: true,  // Fire on the first click.
            trailing: false, // Do not fire again after the cooldown.
        }),
        [] // Empty dependency array means the throttled function is created only once.
    );

    let Wrapper = ({ children }) => (tooltip) ? <Tooltip title={tooltip}>{children}</Tooltip> : <>{children}</>;

    return <Wrapper><Button {...props} onClick={throttledHandlePress} icon={<LeftOutlined />}>{props.children}</Button></Wrapper>
}
BackButton.propTypes = {
    onClick: PropTypes.func,
    tooltip: PropTypes.string,
}

export const DeleteButton = (props) => {
    const [busy, setBusy] = useState(false);

    const onClick = async () => {
        setBusy(true);
        await props.onClick()
        setBusy(false);
    }

    const throttledHandlePress = useCallback(
        throttle(onClick, 2000, {
            leading: true,  // Fire on the first click.
            trailing: false, // Do not fire again after the cooldown.
        }),
        [] // Empty dependency array means the throttled function is created only once.
    );

    let Wrapper = ({ children }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;

    if (props.skipConfirm) return <Wrapper><Button disabled={props.disabled} onClick={throttledHandlePress} loading={props.loading || busy} icon={<DeleteOutlined />} danger type="primary" size={props.size} shape={props.shape || "circle"} /></Wrapper>

    let _children = <Button icon={<DeleteOutlined />} disabled={props.disabled} loading={props.loading || busy} color={props.color || "red"} type="primary" size={props.size} shape={props.shape || "circle"} />;
    if (props.children && _.isString(props.children)) _children = <Button disabled={props.disabled} loading={props.loading || busy} color={props.color || "red"} type="primary" size={props.size}>{props.children}</Button>;
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

export const ArchiveButton = (props) => {
    const [busy, setBusy] = useState(false);

    const onClick = async () => {
        setBusy(true);
        await props.onClick()
        setBusy(false);
    }

    const throttledHandlePress = useCallback(
        throttle(onClick, 2000, {
            leading: true,  // Fire on the first click.
            trailing: false, // Do not fire again after the cooldown.
        }),
        [] // Empty dependency array means the throttled function is created only once.
    );

    let Wrapper = ({ children }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;

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

export const UnArchiveButton = (props) => {
    const [busy, setBusy] = useState(false);

    const onClick = async () => {
        setBusy(true);
        await props.onClick()
        setBusy(false);
    }

    const throttledHandlePress = useCallback(
        throttle(onClick, 2000, {
            leading: true,  // Fire on the first click.
            trailing: false, // Do not fire again after the cooldown.
        }),
        [] // Empty dependency array means the throttled function is created only once.
    );

    let Wrapper = ({ children }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;

    if (props.skipConfirm) return <Wrapper><Button onClick={throttledHandlePress} loading={props.loading || busy} icon={<UngroupOutlined />} danger type="primary" size={props.size} shape={props.shape || "circle"} /></Wrapper>;
    
    return <Wrapper><Popconfirm
        title={props?.title || "Confirm action"}
        description={props?.description || "Are you sure to archive this record?"}
        onConfirm={props.onConfirm || throttledHandlePress}
        onCancel={props.onCancel}
        okText={props?.okText || "Yes"}
        cancelText={props?.cancelText || "No"}
    >
        {props.children || <Button icon={<UngroupOutlined />} loading={props.loading || busy} color="blue" type="primary" size={props.size} shape={props.shape || "circle"} />}
    </Popconfirm></Wrapper>
}

export const IconButton = ({ onClick, ...props }) => {
    let _icon = <Icon icon={props.icon} />

    const throttledHandlePress = useCallback(
        throttle(onClick, 2000, {
            leading: true,  // Fire on the first click.
            trailing: false, // Do not fire again after the cooldown.
        }),
        [] // Empty dependency array means the throttled function is created only once.
    );

    if (props.tooltip) return <Tooltip title={props.tooltip}><Button onClick={throttledHandlePress} {...props} icon={_icon} /></Tooltip>;
    return <Button onClick={throttledHandlePress} {...props} icon={_icon} />

    // let Wrapper = ({ children }) => (props.tooltip) ? <Tooltip title={props.tooltip}>{children}</Tooltip> : <>{children}</>;
    // return <Wrapper><Button {...props} icon={_icon} /></Wrapper>
}

export const MenuButton = ({ onClick, ...props }) => {

    const throttledHandlePress = useCallback(
        throttle(onClick, 2000, {
            leading: true,  // Fire on the first click.
            trailing: false, // Do not fire again after the cooldown.
        }),
        [] // Empty dependency array means the throttled function is created only once.
    );

    return <Button onClick={throttledHandlePress} {...props}><MenuOutlined /></Button>
}

export const ActionButton = ({ style, size, items, disabled, placement, color }) => {
    // let _items = items ? items.map((item, i) => ({ ...item, key:i })) : []


    let _items = items ? items.map(({ onClick, ...item }, i) => {
        let throttledHandlePress = useCallback(
            throttle(onClick, 2000, {
                leading: true,  // Fire on the first click.
                trailing: false, // Do not fire again after the cooldown.
            }),
            [] // Empty dependency array means the throttled function is created only once.
        );
        return ({
            key: (i + 1),
            label: <a href="javascript:void(0)" rel="noopener noreferrer" onClick={throttledHandlePress}>{item.label}</a>
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
