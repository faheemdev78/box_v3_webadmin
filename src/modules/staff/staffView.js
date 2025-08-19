'use client'

import React, { useState, useEffect } from 'react'
import { Button, DevBlock, IconButton } from '@_/components';
import { __error } from '@_/lib/consoleHelper';
import { Col, Modal, Row } from 'antd';
import { StaffEditForm } from './staffEditForm';


export const StaffView = ({ onStatusUpdate, onUpdate, staff }) => {
    const [mode, setMode] = useState('view')

    return (<>
        {/* {error && <Alert message={error} showIcon type='error' />} */}

        <h1>{staff.name} <IconButton onClick={() => setMode('edit')} icon="pen" size="small" /></h1>

        <p>Name: {staff.name}</p>
        <p>Email: {staff.email}</p>
        <p>Phone: {staff.phone}</p>

        <DevBlock obj={staff} />

        <Modal title="Edit Staff" open={mode === 'edit'} onCancel={() => setMode('view')} footer={false} destroyOnHidden>
            <StaffEditForm initialValues={staff} onSuccess={onUpdate} />
        </Modal>
    </>)
}
StaffView.propTypes = {
    // params: PropTypes.object,
}
