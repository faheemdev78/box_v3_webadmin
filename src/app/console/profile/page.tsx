'use client'

import React from 'react'
// import { useSession } from 'next-auth/react'
import { DataRow, DevBlock, Loader, StatusTag } from '@_/components';
import { PageHeader } from '@_/template';
import { Card } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

export default function Profile() {
    // const { data: session, status, update } = useSession();
    const session = useSelector((state) => state.session);

    // if (status === "loading") return <Loader loading={true} />

    return (<>
        <PageHeader title="My Profile" sub={<StatusTag value={session.user.status} />}></PageHeader>

        <Card>
            <DataRow label={"Name"}>{session.user.name}</DataRow>
            <DataRow label={"Email"}>{session.user.email}</DataRow>

            {/* <DevBlock obj={session.user} /> */}
        </Card>
        
    </>
    )
}
