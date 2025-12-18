// 'use client'

// import React, { useState, useEffect, useRef } from 'react'
import { __error, __yellow } from '@/lib/consoleHelper';
// import { ProductView } from "@/modules/products";
import { CustomerWrapper } from '@/modules/customers';
import { Alert, Card, Col, Divider, Row } from 'antd';
import { Avatar, DevBlock } from '@/components';
import { PasswordUpdateButton } from '@/modules/user/components';

function CustomerDashboard({ user, session, refresh }: { user: any; session: any; refresh: () => void }) {
    if (!session || !session?.user?._id) return <Alert title="Error" description="Invalid user session" showIcon type='error' />

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

function Wrapper(props: any){
    return (<CustomerWrapper {...props} render={({ user, session, refresh }: { user:any, session:any, refresh: any }) => (<CustomerDashboard user={user} session={session} refresh={refresh} {...props} />)} />)
}

export default Wrapper;
