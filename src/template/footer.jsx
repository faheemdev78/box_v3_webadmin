'use client'

import { useDispatch, useSelector } from 'react-redux';
import { useAppSelector } from '@_/rStore/hooks';
import { getSession } from '@_/rStore/slices/sessionSlice';
import { DevBlock } from '@_/components';
import { getSettings } from '@_/rStore/slices/systemSlice';



export function Footer({  }) {
    // const session = useSelector((state) => state.session);
    const session = useAppSelector(getSession)
    const settings = useAppSelector(getSettings)

    return (<div>
        <DevBlock obj={settings} title="settings" />
        <DevBlock obj={session} title="redux session" />
    </div>)
}
