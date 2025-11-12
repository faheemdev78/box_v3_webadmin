'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultDateTimeFormat, defaultPageSize, defaultPagination } from '@_/configs';
import Link from 'next/link';
import { Button, IconButton, PageHeading, Table } from '@_/components';
import { Page } from '@_/template/page';
import { PageBar, PageHeader } from '@_/template';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';

import LIST_DATA from '@_/graphql/vouchers/vouchersQuery.graphql'
import RECORD_DELETE from '@_/graphql/vouchers/deleteVoucher.graphql';
import { utcToDate } from '@_/lib/utill';

const defaultFilter = { status: 'online' }


export default function Vouchers(props:any) {
    const [state, setState] = useState({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
    })

    const [dataArray, set_dataArray] = useState(null)
    const [busy, setBusy] = useState(false)

    const [deleteVoucher, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }
    const [vouchersQuery, { called, loading }] = useLazyQuery(LIST_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called) return;
        fetchData({})
    }, [props])

    const fetchData = async ({ filter, pagination = {} }) => {
        const variables = {
            limit: pagination?.pageSize || state.pagination.pageSize,
            page: pagination?.current || state.pagination.current,
            filter: filter || state.filter || {},
            others: state.others || {},
        }

        setBusy(true)
        const resutls = await vouchersQuery({
            variables: {
                ...variables,
                filter: JSON.stringify(variables.filter || {}),
                others: JSON.stringify(variables.others || {})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.vouchersQuery }))
            .catch(catchApolloError)
        setBusy(false)

        if (resutls && resutls.error) {
            message.error(resutls.error.message);
            return;
        }

        setState({
            ...state,
            pagination: {
                ...state.pagination,
                current: resutls.pagination.page,
                total: resutls.pagination.totalDocs,
                // resutls.pagination.totalPages,
                pageSize: resutls.pagination.limit,
            },
            filter: variables.filter,
            dataSource: resutls?.edges?.map(o => ({
                ...o,
                children: o?.variations?.length > 0 && o.variations,
                variations: undefined
            })),
        })

    }

    const handleTableChange = (pagination, filters, sorter) => {
        fetchData({
            pagination: {
                pageSize: pagination.pageSize,
                current: pagination.page,
            }
        })
    };


    const handleDelete = async ({ _id }) => {
        let results = await deleteVoucher(id)
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deleteVoucher }))
            .catch(catchApolloError)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }

    const columns = [
        { title: 'Title', dataIndex: 'title', key: 'title',
            render: (title: string, rec: any) => {
                return <Link href={`${adminRoot}/vouchers/details/${rec._id}`}>{title}</Link>
            }
        },
        { title: 'Type', dataIndex: 'type', key: 'type', width: 150, align: 'center' },
        { title: 'Schedule', dataIndex: 'startDate', key: 'startDate', width: 230, align: 'left', render: (___:string, rec:any) => {
            return (<>
                <div><b>From: </b>{utcToDate(rec.startDate).format(defaultDateTimeFormat)}</div>
                <div><b>To: </b>{utcToDate(rec.endDate).format(defaultDateTimeFormat)}</div>
            </>)
        } },
        { title: 'Used Count', dataIndex: 'usedCount', key: 'usedCount', width: 100, align: 'center' },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' },
        {
            title: 'Actions', dataIndex: 'actions', width: 120, key: 'actions', align: 'right',
            render: (text: string, rec: any) => {
                return (<Space>
                    {/* <IconButton onClick={() => set_showForm({ show: true, fields: rec })} icon="pen" /> */}
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}>
                        <IconButton onClick={()=>void(0)} icon="trash-alt" />
                    </Popconfirm>
                </Space>)
            }
        },
    ];
    

    return (<>
        <PageHeader title={"Discount Vouchers"} sub={<div>{(dataArray && dataArray?.pagination?.totalDocs) || 0} records found</div>}>
            <Link href={`${adminRoot}/vouchers/new`} >Add New Voucher</Link>
        </PageHeader>
    
        <Page>
            <Table 
                bordered
                loading={loading || busy}
                columns={columns}
                dataSource={state.dataSource}
                total={state?.pagination?.total || 0}
                pagination={state.pagination || false}
                pageSize={state?.pagination?.pageSize}
                current={state?.pagination?.current || 1}
                rowClassName={((record:any) => {
                    return record.status == 'offline' ? 'disabled-table-row' : "";
                })}
                onChange={({ current, pageSize }) => handleTableChange({page: current, pageSize })}
            />
        </Page>

    </>)

}

// export async function generateMetadata(_, parent) {
//     const headersList = headers();
//     const store_id = headersList.get('x-store-id');
//     return { title: `Store ${store_id}` };
// }
