import React, { useState } from 'react'
import { Popover, Space } from 'antd'
import { Button, DeleteButton } from './button'
import { Icon } from './icon'


/**
 <PopMenu direction="horizontal" placement="left" 
    items={[
        { onClick: () => set_showFieldForm(field), label: "Edit" },
        { onClick: () => onDeletePress(field._id), label: "Delete", type: 'delete' }
    ]}
></PopMenu>
*/
export function PopMenu({ placement = "topRight", trigger = "click", title = false, items, direction = 'vertical' }) {
    const [open, setOpen] = useState(false)

    return (<>
        <Popover
            content={<Space direction={direction}>{items.map((item, i) => {
                if(item.type=='delete'){
                    return (<DeleteButton onClick={() => {
                        item.onClick();
                        setOpen(false)
                    }}>{item.label}</DeleteButton>)
                }

                return (<Button onClick={() => {
                    item.onClick();
                    setOpen(false)
                }} key={i}>{item.label}</Button>)

            })}</Space>}
            title={title}
            trigger={trigger}
            placement={placement}
            open={open}
            onOpenChange={(op) => setOpen(op)}
        >
            <Button icon={<Icon icon="ellipsis-v" />} />
        </Popover>
    </>)

}
