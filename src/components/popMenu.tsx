'use client'
import React, { ReactNode, useState } from 'react'
import { Popover, Space, Popconfirm } from 'antd'
import type { ButtonProps, PopoverProps, SpaceProps } from 'antd';
import _ from 'lodash';
import { Button, DeleteButton } from './button'
import { Icon } from './icon'


/**
 <PopMenu orientation="horizontal" placement="left" 
    items={[
        { onClick: () => set_showFieldForm(field), label: "Edit" },
        { onClick: () => onDeletePress(field._id), label: "Delete", type: 'delete' }
    ]}
></PopMenu>
*/

interface PopMenuItemProps {
    label: string | ReactNode;
    confirm?: boolean | string;
    href?: string;
    onClick?: () => any;
    hide?: boolean;
    type?: 'delete';
}
interface PopMenuProps extends PopoverProps {
    items: PopMenuItemProps[];
    orientation?: SpaceProps['orientation'];
    size?: ButtonProps['size'];
    shape?: ButtonProps['shape'];
}


export function PopMenu({ placement = "topRight", trigger = "click", title = false, items, orientation = 'vertical', size = "middle", shape = 'default', ...props }: PopMenuProps) {
    const [open, setOpen] = useState(false)

    return (<>
        <Popover
            content={<Space orientation={orientation} style={{width:"100%"}}>{items.filter(o=>!o.hide).map((item:any, i:number) => (<div key={i}>
                {item.type == 'delete' ? <>
                    <DeleteButton block size={size} 
                        {...props}
                        onClick={() => {
                            item.onClick();
                            setOpen(false)
                        }}>{item.label}</DeleteButton>
                </> : <>
                    {item.confirm ? <Popconfirm title="Confirm Action!"
                        description={_.isString(item.confirm) ? item.confirm : "Are you sure to proceed?"}
                        onConfirm={()=>{
                            item.onClick();
                            setOpen(false)
                        }}
                        // onCancel={cancel}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button block danger>{item.label}</Button>
                    </Popconfirm> : 
                     <Button block size={size}
                        onClick={() => {
                            if (item.onClick) item.onClick();
                            setOpen(false)
                        }}>{item.label}</Button>}
                    
                </>} 
            </div>))}</Space>}
            title={title}
            trigger={trigger}
            placement={placement}
            open={open}
            onOpenChange={(op) => setOpen(op)}
        >
            <Button icon={<Icon icon="ellipsis-v" />} shape={shape} />
        </Popover>
    </>)

}
