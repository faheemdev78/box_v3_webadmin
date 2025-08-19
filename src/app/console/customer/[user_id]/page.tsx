'use client'

import React, { useState, useEffect, useRef } from 'react'
import { __error, __yellow } from '@_/lib/consoleHelper';
// import { ProductView } from "@/modules/products";
import { CustomerWrapper } from '@_/modules/customers';
import { Alert, Card, Col, Divider, Row } from 'antd';
import { Avatar, DevBlock } from '@_/components';
import { PasswordUpdateButton } from '@_/modules/user/components';

function CustomerDashboard({ user, session, refresh }) {
    if (!session || !session?.user?._id) return <Alert message="Invalid user session" showIcon type='error' />

    return (<>
        {/* <ProductView initialValues={product} session={session} refresh={refresh} /> */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}>
                <h3>{user.name}</h3>
                <Avatar src={user?.avatarUrl} size={64} />
                <div>User: {user.email}</div>
                <div>Phone: {user.phone}</div>
                <PasswordUpdateButton _id={user._id} query_type="updateUserPwd" />
            </Col>
            <Col span={12}>
                <DevBlock obj={user} />
            </Col>
            <Col span={6}>
                <Divider>Orders</Divider>
            </Col>
        </Row>
    </>)
}

export default function Wrapper(props){
    return (<CustomerWrapper {...props} render={({ user, session, refresh }) => (<CustomerDashboard user={user} session={session} refresh={refresh} {...props} />)} />)
}
