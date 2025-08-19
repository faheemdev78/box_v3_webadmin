'use client'
import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { Popconfirm, Alert, message, Row, Col, Space } from 'antd';
import { Avatar, IconButton, Table } from '@_/components';
import { __error } from '@_/lib/consoleHelper';
import { adminRoot } from '@_/configs';
import Link from 'next/link';


export const CustomerList = ({ dataSource, pagination = false, handleDelete, loading }) => {
    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name',
            render: (___, rec) => {
                return (<Space>
                    <Avatar src={rec.avatarUrl} />
                    <div>
                        <Link href={`${adminRoot}/customer/${rec._id}`}>{rec.name}</Link>
                        <div>{rec.email}</div>
                    </div>
                </Space>)
            }
        },
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
CustomerList.propTypes = {
    dataSource: PropTypes.array,
    pagination: PropTypes.object,
    handleDelete: PropTypes.func,
    loading: PropTypes.bool
}

