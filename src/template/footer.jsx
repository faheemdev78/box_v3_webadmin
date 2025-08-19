'use client'

import { useDispatch, useSelector } from 'react-redux';
import { useAppSelector } from '@_/rStore/hooks';
import { getSession } from '@_/rStore/slices/sessionSlice';
import { DevBlock } from '@_/components';



export function Footer({  }) {
    // const session = useSelector((state) => state.session);
    const session = useAppSelector(getSession)

    return (<div>
        <DevBlock obj={session} title="redux session" />
    </div>)
}
