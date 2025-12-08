'use client'

import React from 'react'
// import { useSession } from 'next-auth/react'
import { DataRow, DevBlock, Loader } from '@_/components';
import { PageHeader } from '@_/template';
import { Card } from 'antd';
import { useAppSelector } from '@_/rStore/hooks';
import type { RootState } from '@_/rStore';

function Profile() {
    // const { data: session, status, update } = useSession();
    const session = useAppSelector((state: RootState) => state.session);

    // if (status === "loading") return <Loader loading={true} />

    return (<>
        <PageHeader title="My Profile"></PageHeader>

        <Card>
            <DataRow label={"Name"}>{session.user.name}</DataRow>
            <DataRow label={"Email"}>{session.user.email}</DataRow>

            {/* <DevBlock obj={session.user} /> */}
        </Card>
        
    </>
    )
}

export default Profile;