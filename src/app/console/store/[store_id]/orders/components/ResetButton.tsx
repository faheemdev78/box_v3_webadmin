'use client'
import { IconButton } from "@/components"
import { Popconfirm } from "antd"
import { useState } from "react"

export const ResetButton = ({ handleResetOrder, size='small' }: { handleResetOrder: Function, size?: 'small' | 'middle' | 'large' }) => {
    const [busy, setBusy] = useState(false)

    async function _handleResetOrder(){
        setBusy(true)
        await handleResetOrder()
        setBusy(false)
    }

    return (<Popconfirm title="Reset Order to Zero"
        description={<div>
            <p>This will completely reset the order and release all resources:</p>
            <ul style={{ marginLeft: 16, fontSize: '12px' }}>
                <li>Release all assigned baskets</li>
                <li>Clear staff assignments</li>
                <li>Remove from till queue</li>
                <li>Restore inventory allocation</li>
                <li>Cancel all progress data</li>
            </ul>
            <p><strong>Are you sure you want to continue?</strong></p>
        </div>}
        onConfirm={_handleResetOrder}
        okText="Yes, Reset Order"
        cancelText="Cancel"
        okType="danger"
        placement="left"
    >
        <IconButton
            size={size}
            icon="refresh"
            color="red"
            onClick={() => { }}
            loading={busy}
            tooltip="Reset order to zero and release all resources"
        />
    </Popconfirm>)
}
