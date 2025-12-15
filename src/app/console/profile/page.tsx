'use client'

import { DataRow, DevBlock, Loader } from '@/components';
import { PageHeader } from '@/template';
import { Card } from 'antd';
import { useAppSelector } from '@/rStore/hooks';
import type { RootState } from '@/rStore';

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