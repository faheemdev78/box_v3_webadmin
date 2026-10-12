'use client'

import { __error, __yellow } from '@/lib/consoleHelper';

import { StaffWrapper } from "@/modules/staff";
import { StaffProfile } from './components';

function Wrapper(props: any){
    // const { prod_id } = useParams<{ prod_id: string }>()
    return (<StaffWrapper {...props} render={({ staff, onStatusUpdate }: { staff: any; onStatusUpdate: any }) => (<StaffProfile onStatusUpdate={onStatusUpdate} staff={staff} {...props} />)} />)
    // return (<StaffWrapper {...props} render={({ staff, onStatusUpdate }) => (<StaffView onStatusUpdate={onStatusUpdate} staff={staff} {...props} />)} />)
}

export default Wrapper;
