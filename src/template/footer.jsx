'use client'

import { useAppSelector } from '@/rStore/hooks';
import { getSession } from '@/rStore/slices/sessionSlice';
import { DevBlock } from '@/components/devBlock';
import { getSettings } from '@/rStore/slices/systemSlice';



export function Footer({  }) {
    // const session = useSelector((state) => state.session);
    const session = useAppSelector(getSession)
    const settings = useAppSelector(getSettings)

    return (<div>
        <DevBlock obj={settings} title="settings" />
        <DevBlock obj={session} title="redux session" />
    </div>)
}
