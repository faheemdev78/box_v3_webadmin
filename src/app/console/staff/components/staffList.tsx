'use client'
import { Popconfirm, Alert, message, Row, Col, Space } from 'antd';
import { Avatar, IconButton, Table } from '@/components';
import { ColumnsType } from 'antd/es/table';
import { __error } from '@/lib/consoleHelper';
import { adminRoot } from '@/configs';
import Link from 'next/link';


export const StaffList = ({ dataSource, pagination = false, handleDelete, loading }: {
    dataSource: any[];
    pagination: any | boolean;
    handleDelete: (args:any)=>void | null;
    loading: boolean
}) => {
    const columns: ColumnsType<any> = [
        { title: 'Name', dataIndex: 'name', key: 'name',
            render: (_name: string, rec:any) => {
                return (<Space>
                    <Avatar src={rec.avatarUrl} />
                    <div>
                        {rec?.store?._id
                            ? <Link href={`${adminRoot}/store/${rec.store._id}/staff/${rec._id}/view`}>{rec.name}</Link>
                            : <Link href={`${adminRoot}/staff/profile/${rec._id}`}>{rec.name}</Link>}
                        {/* <Link href={`${adminRoot}/user/${rec._id}/view`}>{rec.name}</Link> */}
                        <div>{rec.email}</div>
                    </div>
                </Space>)
            }
        },
        { title: 'Store', dataIndex: ['store', 'title'], key: 'store' },
        { title: 'Type', dataIndex: 'acc_type', key: 'acc_type', width: 200 },
        { title: 'Group', dataIndex: 'acc_group', key: 'acc_group', width: 100 },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const },
        { title: 'Actions', dataIndex: 'actions', width: 120, key: 'actions', align: 'right' as const,
            render: (_text: any, rec: any) => {
                return (<Space>
                    {/* <IconButton onClick={() => set_showForm({ show: true, fields: rec })} icon="pen" /> */}
                    {handleDelete && <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}>
                        <IconButton icon="trash-alt" />
                    </Popconfirm>}
                </Space>)
            }
        },
    ];


    return (<>
        <Table
            bordered
            loading={loading}
            columns={columns}
            dataSource={dataSource}
            pagination={pagination}
        />
    </>)

}
