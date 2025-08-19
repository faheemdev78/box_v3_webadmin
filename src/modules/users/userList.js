'use client'
import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { Popconfirm, Alert, message, Row, Col, Space } from 'antd';
import { Avatar, IconButton, Table } from '@_/components';
import { __error } from '@_/lib/consoleHelper';
import { adminRoot } from '@_/configs';
import Link from 'next/link';


export const UsersList = ({ dataSource, pagination = false, handleDelete, loading }) => {
    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name',
            render: (___, rec) => {
                return (<Space>
                    <Avatar src={rec.avatarUrl} />
                    <div>
                        {rec?.store?._id
                            ? <Link href={`${adminRoot}/store/${rec.store._id}/staff/${rec._id}/view`}>{rec.name}</Link>
                            : <Link href={`${adminRoot}/user/${rec._id}/view`}>{rec.name}</Link>}
                        {/* <Link href={`${adminRoot}/user/${rec._id}/view`}>{rec.name}</Link> */}
                        <div>{rec.email}</div>
                    </div>
                </Space>)
            }
        },
        { title: 'Store', dataIndex: ['store', 'title'], key: 'store' },
        { title: 'Type', dataIndex: 'acc_type', key: 'acc_type', width: 200 },
        { title: 'Group', dataIndex: 'acc_group', key: 'acc_group', width: 100 },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' },
        { title: 'Actions', dataIndex: 'actions', width: 120, key: 'actions', align: 'right',
            render: (text, rec) => {
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
UsersList.propTypes = {
    dataSource: PropTypes.array,
    pagination: PropTypes.object,
    handleDelete: PropTypes.func,
    loading: PropTypes.bool
}

