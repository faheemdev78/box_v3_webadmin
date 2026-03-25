'use client'
import React, { useState } from 'react'
import { Popover, Space } from 'antd'
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
export function PopMenu({ placement = "topRight", trigger = "click", title = false, items, orientation = 'vertical', size = "default", shape = 'default' }) {
    const [open, setOpen] = useState(false)

    return (<>
        <Popover
            content={<Space orientation={orientation}>{items.map((item, i) => (<div key={i}>
                {item.type == 'delete' ? <>
                    <DeleteButton block
                        size={size} 
                        onClick={() => {
                            item.onClick();
                            setOpen(false)
                        }}>{item.label}</DeleteButton>
                </> : <>
                    <Button block 
                        size={size} 
                        onClick={() => {
                            item.onClick();
                            setOpen(false)
                        }}>{item.label}</Button>
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
