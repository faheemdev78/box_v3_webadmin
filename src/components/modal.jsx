'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Modal } from 'antd';
import Draggable from 'react-draggable';


export const DragableModal = ({ children, title, open, onCancel, width }) => {
    // const [open, setOpen] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef(null);
    // const showModal = () => setOpen(true);
    // const handleOk = (e) => setOpen(false);
    // const handleCancel = (e) => setOpen(false);
    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) return;
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    const titleProps = {
        style: { width: '100%', cursor: 'move' },
        onMouseOver: () => {
            if (disabled) setDisabled(false);
        },
        onMouseOut: () => setDisabled(true),
        onFocus: () => { },
        onBlur: () => { },
    }

    return (<>
        {/* <Button onClick={showModal}>Open Draggable Modal</Button> */}
        <Modal width={width || 500}
            footer={false}
            destroyOnHidden
            title={<div {...titleProps}>{title}</div>}
            open={open}
            onCancel={onCancel}
            modalRender={(modal) => (
                <Draggable disabled={disabled} bounds={bounds} nodeRef={draggleRef} onStart={(event, uiData) => onStart(event, uiData)}>
                    <div ref={draggleRef}>{modal}</div>
                </Draggable>
            )}
        >
            {children}
        </Modal>
    </>);
};
