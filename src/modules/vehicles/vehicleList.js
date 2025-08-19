'use client'
import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { Popconfirm, Alert, message, Row, Col, Space } from 'antd';
import { IconButton, Table } from '@_/components';
import { __error } from '@_/lib/consoleHelper';
import { adminRoot } from '@_/configs';
import Link from 'next/link';


export const VehiclesList = ({ dataSource, pagination = false, handleDelete, loading }) => {
    const columns = [
        { title: 'Title', dataIndex: 'title', key: 'title',
            render: (___, rec) => {
                return (<>
                    <Link href={`${adminRoot}/store/${rec.store._id}/vehicle/${rec._id}/view`}>{rec.title}</Link>
                    <p>Reg.# {rec.registration_no}</p>
                </>)
            }
        },
        { title: 'Store', dataIndex: ['store', 'title'], key: 'store' },
        { title: 'Zones', dataIndex: "zones", key: 'zones', render:(__, rec) => {
            return rec?.zones?.map(o=>(o.title)).join(", ")
        } },
        { title: 'Drivers', dataIndex: 'drivers', key: 'drivers', render: (__, rec) => {
            return rec?.drivers?.map(o => (o.name)).join(", ")
        } },
        { title: 'Cpacity', dataIndex: 'box_cpacity', key: 'box_cpacity', width: 100, align: 'center' },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' },
        { title: 'Actions', dataIndex: 'actions', width: 120, key: 'actions', align: 'right',
            render: (text, rec) => {
                return (<Space>
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
VehiclesList.propTypes = {
    dataSource: PropTypes.array,
    pagination: PropTypes.object,
    handleDelete: PropTypes.func,
    loading: PropTypes.bool
}

