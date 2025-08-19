'use client'

import React, { useState, useEffect } from 'react'
import { Switch } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';


export const AsyncSwitch = ({ onSubmit, disabled=false, ...props }) => {
    const [busy, setBusy] = useState(false)
    const [value, setValue] = useState(props.value || false)

    async function onChnaged(val) {
        setValue(val)
        setBusy(true)
        let resutls = await onSubmit(val)
        setBusy(false)
        if (!resutls) setValue(!value);
    }

    return <Switch checkedChildren={<CheckOutlined />} disabled={disabled} nCheckedChildren={<CloseOutlined />} loading={busy} value={value} onChange={(val) => onChnaged(val)} />
}


